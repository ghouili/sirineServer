import bcrypt from "bcrypt";

import {
  PrismaClient as GlobalPrismaClient,
  BillingPeriod,
  LicenseType,
  SubscriptionStatus,
  TenantStatus
} from "../prisma/generated/global";
import {
  PrismaClient as TenantPrismaClient,
  AppointmentStatus,
  NotificationStatus,
  UserRole
} from "../prisma/generated/tenant";
import { env } from "../src/config/env";

async function seedGlobal(globalPrisma: GlobalPrismaClient) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  await globalPrisma.superAdmin.upsert({
    where: { email: "superadmin@slotycare.test" },
    update: { nom: "Super Admin", password_hash: passwordHash },
    create: {
      nom: "Super Admin",
      email: "superadmin@slotycare.test",
      password_hash: passwordHash
    }
  });

  const licenseData = [
    {
      nom: "Bronze Mensuel",
      type: LicenseType.bronze,
      billing_period: BillingPeriod.monthly,
      duration_months: 1,
      prix_mensuel: 29.0,
      features: { maxUsers: 3, support: "email" }
    },
    {
      nom: "Bronze Annuel",
      type: LicenseType.bronze,
      billing_period: BillingPeriod.yearly,
      duration_months: 12,
      prix_mensuel: 24.0,
      features: { maxUsers: 3, support: "email" }
    },
    {
      nom: "Silver Mensuel",
      type: LicenseType.silver,
      billing_period: BillingPeriod.monthly,
      duration_months: 1,
      prix_mensuel: 59.0,
      features: { maxUsers: 8, support: "priority" }
    },
    {
      nom: "Silver Annuel",
      type: LicenseType.silver,
      billing_period: BillingPeriod.yearly,
      duration_months: 12,
      prix_mensuel: 49.0,
      features: { maxUsers: 8, support: "priority" }
    },
    {
      nom: "Gold Mensuel",
      type: LicenseType.gold,
      billing_period: BillingPeriod.monthly,
      duration_months: 1,
      prix_mensuel: 99.0,
      features: { maxUsers: 20, support: "dedicated" }
    },
    {
      nom: "Gold Annuel",
      type: LicenseType.gold,
      billing_period: BillingPeriod.yearly,
      duration_months: 12,
      prix_mensuel: 79.0,
      features: { maxUsers: 20, support: "dedicated" }
    }
  ];

  const licenses = [] as Array<{ id: string; type: LicenseType; billing_period: BillingPeriod }>;
  for (const license of licenseData) {
    const existing = await globalPrisma.license.findFirst({
      where: { type: license.type, billing_period: license.billing_period }
    });
    if (existing) {
      licenses.push(existing);
      continue;
    }

    const created = await globalPrisma.license.create({ data: license });
    licenses.push(created);
  }

  const bronzeMonthly =
    licenses.find(
      (license) =>
        license.type === LicenseType.bronze &&
        license.billing_period === BillingPeriod.monthly
    ) ?? licenses[0];

  const promoExisting = await globalPrisma.promotion.findFirst({
    where: { license_id: bronzeMonthly.id, discount_rate: 15.0 }
  });

  if (!promoExisting) {
    await globalPrisma.promotion.create({
      data: {
        license_id: bronzeMonthly.id,
        discount_rate: 15.0,
        is_active: true,
        starts_at: new Date(),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  const tenant = await globalPrisma.tenant.upsert({
    where: { slug: "cabinet-demo" },
    update: { nom: "Cabinet Demo", status: TenantStatus.active },
    create: {
      nom: "Cabinet Demo",
      slug: "cabinet-demo",
      status: TenantStatus.active
    }
  });

  const activeLicense =
    licenses.find(
      (license) =>
        license.type === LicenseType.silver &&
        license.billing_period === BillingPeriod.monthly
    ) ??
    (await globalPrisma.license.findFirstOrThrow({
      where: { type: LicenseType.silver, billing_period: BillingPeriod.monthly }
    }));

  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await globalPrisma.subscription.upsert({
    where: { reference: "SUB-DEMO-001" },
    update: {
      tenant_id: tenant.id,
      license_id: activeLicense.id,
      status: SubscriptionStatus.active,
      billing_period: BillingPeriod.monthly,
      start_date: now,
      end_date: endDate
    },
    create: {
      tenant_id: tenant.id,
      license_id: activeLicense.id,
      status: SubscriptionStatus.active,
      billing_period: BillingPeriod.monthly,
      start_date: now,
      end_date: endDate,
      reference: "SUB-DEMO-001",
      cabinet_nom: "Cabinet Demo",
      specialite: "General"
    }
  });

  if (env.TENANT_DATABASE_URL) {
    try {
      const url = new URL(env.TENANT_DATABASE_URL);
      const dbName = url.pathname.replace(/^\//, "");
      const dbHost = url.host;
      const dbUser = url.username || undefined;
      const dbPassword = url.password || undefined;

      await globalPrisma.tenantDatabase.upsert({
        where: { tenant_id: tenant.id },
        update: {
          db_url: env.TENANT_DATABASE_URL,
          db_name: dbName || undefined,
          db_host: dbHost || undefined,
          db_user: dbUser,
          db_password: dbPassword,
          db_status: "ready"
        },
        create: {
          tenant_id: tenant.id,
          db_url: env.TENANT_DATABASE_URL,
          db_name: dbName || undefined,
          db_host: dbHost || undefined,
          db_user: dbUser,
          db_password: dbPassword,
          db_status: "ready"
        }
      });
    } catch (error) {
      console.warn("Skipping tenant database registry upsert:", (error as Error).message);
    }
  }

  console.log("Global seed completed:", { tenantId: tenant.id, slug: tenant.slug });
  return tenant.id;
}

async function seedTenant(tenantDbUrl: string, tenantId: string) {
  const tenantPrisma = new TenantPrismaClient({
    datasources: { db: { url: tenantDbUrl } }
  });

  try {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const admin = await tenantPrisma.user.upsert({
      where: { tenant_id_email: { tenant_id: tenantId, email: "admin@cabinet-demo.test" } },
      update: { password_hash: passwordHash, role: UserRole.admin, is_active: true },
      create: {
        tenant_id: tenantId,
        email: "admin@cabinet-demo.test",
        password_hash: passwordHash,
        nom: "Admin",
        prenom: "Demo",
        role: UserRole.admin
      }
    });

    const praticien = await tenantPrisma.user.upsert({
      where: { tenant_id_email: { tenant_id: tenantId, email: "praticien@cabinet-demo.test" } },
      update: { password_hash: passwordHash, role: UserRole.praticien, is_active: true },
      create: {
        tenant_id: tenantId,
        email: "praticien@cabinet-demo.test",
        password_hash: passwordHash,
        nom: "Praticien",
        prenom: "Demo",
        role: UserRole.praticien
      }
    });

    await tenantPrisma.user.upsert({
      where: { tenant_id_email: { tenant_id: tenantId, email: "assistant@cabinet-demo.test" } },
      update: { password_hash: passwordHash, role: UserRole.assistant, is_active: true },
      create: {
        tenant_id: tenantId,
        email: "assistant@cabinet-demo.test",
        password_hash: passwordHash,
        nom: "Assistant",
        prenom: "Demo",
        role: UserRole.assistant
      }
    });

    const patient1 =
      (await tenantPrisma.patient.findFirst({
        where: { tenant_id: tenantId, nom: "Dupont", prenom: "Alice" }
      })) ??
      (await tenantPrisma.patient.create({
        data: {
          tenant_id: tenantId,
          nom: "Dupont",
          prenom: "Alice",
          telephone: "+33123456789",
          tags: "vip",
          notes_internes: "Prefers morning appointments"
        }
      }));

    const patient2 =
      (await tenantPrisma.patient.findFirst({
        where: { tenant_id: tenantId, nom: "Martin", prenom: "Leo" }
      })) ??
      (await tenantPrisma.patient.create({
        data: {
          tenant_id: tenantId,
          nom: "Martin",
          prenom: "Leo",
          telephone: "+33612345678"
        }
      }));

    const service1 =
      (await tenantPrisma.service.findFirst({
        where: { tenant_id: tenantId, nom: "Consultation" }
      })) ??
      (await tenantPrisma.service.create({
        data: {
          tenant_id: tenantId,
          nom: "Consultation",
          duration_minutes: 30,
          prix: 45.0
        }
      }));

    const service2 =
      (await tenantPrisma.service.findFirst({
        where: { tenant_id: tenantId, nom: "Suivi" }
      })) ??
      (await tenantPrisma.service.create({
        data: {
          tenant_id: tenantId,
          nom: "Suivi",
          duration_minutes: 45,
          prix: 60.0
        }
      }));

    await tenantPrisma.servicePractitioner.createMany({
      data: [
        { service_id: service1.id, user_id: praticien.id },
        { service_id: service2.id, user_id: praticien.id }
      ],
      skipDuplicates: true
    });

    await tenantPrisma.serviceRule.upsert({
      where: { service_id: service1.id },
      update: {
        tenant_id: tenantId,
        min_notice_hours: 2,
        cancel_notice_hours: 1,
        buffer_minutes: 5
      },
      create: {
        tenant_id: tenantId,
        service_id: service1.id,
        min_notice_hours: 2,
        cancel_notice_hours: 1,
        buffer_minutes: 5
      }
    });

    const workingHour = await tenantPrisma.workingHour.findFirst({
      where: {
        tenant_id: tenantId,
        praticien_id: praticien.id,
        weekday: 1,
        start_time: "09:00",
        end_time: "17:00"
      }
    });

    if (!workingHour) {
      await tenantPrisma.workingHour.create({
        data: {
          tenant_id: tenantId,
          praticien_id: praticien.id,
          weekday: 1,
          start_time: "09:00",
          end_time: "17:00",
          is_active: true
        }
      });
    }

    const breakTime = await tenantPrisma.break.findFirst({
      where: {
        tenant_id: tenantId,
        praticien_id: praticien.id,
        weekday: 1,
        start_time: "12:00",
        end_time: "13:00"
      }
    });

    if (!breakTime) {
      await tenantPrisma.break.create({
        data: {
          tenant_id: tenantId,
          praticien_id: praticien.id,
          weekday: 1,
          start_time: "12:00",
          end_time: "13:00"
        }
      });
    }

    const timeOffStart = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const timeOffEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    const timeOff = await tenantPrisma.timeOff.findFirst({
      where: {
        tenant_id: tenantId,
        praticien_id: praticien.id,
        start_at: timeOffStart,
        end_at: timeOffEnd
      }
    });

    if (!timeOff) {
      await tenantPrisma.timeOff.create({
        data: {
          tenant_id: tenantId,
          praticien_id: praticien.id,
          start_at: timeOffStart,
          end_at: timeOffEnd,
          reason: "Conference"
        }
      });
    }

    const holidayDate = new Date();
    holidayDate.setDate(holidayDate.getDate() + 10);
    holidayDate.setHours(0, 0, 0, 0);

    const holiday = await tenantPrisma.holiday.findFirst({
      where: { tenant_id: tenantId, date: holidayDate }
    });

    if (!holiday) {
      await tenantPrisma.holiday.create({
        data: {
          tenant_id: tenantId,
          date: holidayDate,
          label: "Ferie"
        }
      });
    }

    const appointmentStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const appointmentEnd = new Date(appointmentStart.getTime() + service1.duration_minutes * 60000);

    const appointment =
      (await tenantPrisma.appointment.findFirst({
        where: {
          tenant_id: tenantId,
          patient_id: patient1.id,
          praticien_id: praticien.id,
          date_heure_debut: appointmentStart
        }
      })) ??
      (await tenantPrisma.appointment.create({
        data: {
          tenant_id: tenantId,
          patient_id: patient1.id,
          praticien_id: praticien.id,
          service_id: service1.id,
          date_heure_debut: appointmentStart,
          date_heure_fin: appointmentEnd,
          status: AppointmentStatus.scheduled,
          no_show_probability_score: 0.1,
          ia_recommandation: "Send reminder"
        }
      }));

    const reminder = await tenantPrisma.notification.findFirst({
      where: { appointment_id: appointment.id, type: "reminder_24h" }
    });

    if (!reminder) {
      await tenantPrisma.notification.create({
        data: {
          tenant_id: tenantId,
          appointment_id: appointment.id,
          type: "reminder_24h",
          channel: "email",
          to_email: "patient@example.com",
          subject: "Rappel de rendez-vous",
          payload: { patient: patient1.nom, service: service1.nom },
          status: NotificationStatus.queued,
          schedule_at: new Date(appointmentStart.getTime() - 24 * 60 * 60 * 1000)
        }
      });
    }

    await tenantPrisma.patient.update({
      where: { id: patient2.id },
      data: { notes_internes: "Follow-up next month" }
    });

    console.log("Tenant seed completed:", { tenantId, adminEmail: admin.email });
  } finally {
    await tenantPrisma.$disconnect();
  }
}

async function main() {
  const globalPrisma = new GlobalPrismaClient({
    datasources: { db: { url: env.GLOBAL_DATABASE_URL || env.DATABASE_URL } }
  });

  try {
    const tenantId = await seedGlobal(globalPrisma);
    const registry = await globalPrisma.tenantDatabase.findUnique({
      where: { tenant_id: tenantId }
    });

    const tenantDbUrl = registry?.db_url || env.TENANT_DATABASE_URL;

    if (!tenantDbUrl) {
      console.warn("Skipping tenant seed: TENANT_DATABASE_URL not set and no registry entry.");
      return;
    }

    await seedTenant(tenantDbUrl, tenantId);
  } finally {
    await globalPrisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
