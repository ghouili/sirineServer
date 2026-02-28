import bcrypt from "bcrypt";
import {
  AppointmentStatus,
  BillingPeriod,
  LicenseType,
  NotificationStatus,
  PrismaClient,
  SubscriptionStatus,
  TenantStatus,
  UserRole
} from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  await prisma.superAdmin.upsert({
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

  const licenses = [];
  for (const license of licenseData) {
    const existing = await prisma.license.findFirst({
      where: { type: license.type, billing_period: license.billing_period }
    });
    if (existing) {
      licenses.push(existing);
      continue;
    }

    const created = await prisma.license.create({ data: license });
    licenses.push(created);
  }

  const bronzeMonthly =
    licenses.find(
      (license) =>
        license.type === LicenseType.bronze &&
        license.billing_period === BillingPeriod.monthly
    ) ?? licenses[0];

  const promoExisting = await prisma.promotion.findFirst({
    where: { license_id: bronzeMonthly.id, discount_rate: 15.0 }
  });

  if (!promoExisting) {
    await prisma.promotion.create({
      data: {
        license_id: bronzeMonthly.id,
        discount_rate: 15.0,
        is_active: true,
        starts_at: new Date(),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  const tenant = await prisma.tenant.upsert({
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
    (await prisma.license.findFirstOrThrow({
      where: { type: LicenseType.silver, billing_period: BillingPeriod.monthly }
    }));

  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
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

  const admin = await prisma.user.upsert({
    where: {
      tenant_id_email: { tenant_id: tenant.id, email: "admin@cabinet-demo.test" }
    },
    update: { password_hash: passwordHash, role: UserRole.admin, is_active: true },
    create: {
      tenant_id: tenant.id,
      email: "admin@cabinet-demo.test",
      password_hash: passwordHash,
      nom: "Admin",
      prenom: "Demo",
      role: UserRole.admin
    }
  });

  const praticien = await prisma.user.upsert({
    where: {
      tenant_id_email: { tenant_id: tenant.id, email: "praticien@cabinet-demo.test" }
    },
    update: { password_hash: passwordHash, role: UserRole.praticien, is_active: true },
    create: {
      tenant_id: tenant.id,
      email: "praticien@cabinet-demo.test",
      password_hash: passwordHash,
      nom: "Praticien",
      prenom: "Demo",
      role: UserRole.praticien
    }
  });

  await prisma.user.upsert({
    where: {
      tenant_id_email: { tenant_id: tenant.id, email: "assistant@cabinet-demo.test" }
    },
    update: { password_hash: passwordHash, role: UserRole.assistant, is_active: true },
    create: {
      tenant_id: tenant.id,
      email: "assistant@cabinet-demo.test",
      password_hash: passwordHash,
      nom: "Assistant",
      prenom: "Demo",
      role: UserRole.assistant
    }
  });

  const patient1 =
    (await prisma.patient.findFirst({
      where: { tenant_id: tenant.id, nom: "Dupont", prenom: "Alice" }
    })) ??
    (await prisma.patient.create({
      data: {
        tenant_id: tenant.id,
        nom: "Dupont",
        prenom: "Alice",
        telephone: "+33123456789",
        tags: "vip",
        notes_internes: "Prefers morning appointments"
      }
    }));

  const patient2 =
    (await prisma.patient.findFirst({
      where: { tenant_id: tenant.id, nom: "Martin", prenom: "Leo" }
    })) ??
    (await prisma.patient.create({
      data: {
        tenant_id: tenant.id,
        nom: "Martin",
        prenom: "Leo",
        telephone: "+33612345678"
      }
    }));

  const service1 =
    (await prisma.service.findFirst({
      where: { tenant_id: tenant.id, nom: "Consultation" }
    })) ??
    (await prisma.service.create({
      data: {
        tenant_id: tenant.id,
        nom: "Consultation",
        duration_minutes: 30,
        prix: 45.0
      }
    }));

  const service2 =
    (await prisma.service.findFirst({
      where: { tenant_id: tenant.id, nom: "Suivi" }
    })) ??
    (await prisma.service.create({
      data: {
        tenant_id: tenant.id,
        nom: "Suivi",
        duration_minutes: 45,
        prix: 60.0
      }
    }));

  await prisma.servicePractitioner.createMany({
    data: [
      { service_id: service1.id, user_id: praticien.id },
      { service_id: service2.id, user_id: praticien.id }
    ],
    skipDuplicates: true
  });

  await prisma.serviceRule.upsert({
    where: { service_id: service1.id },
    update: {
      tenant_id: tenant.id,
      min_notice_hours: 2,
      cancel_notice_hours: 1,
      buffer_minutes: 5
    },
    create: {
      tenant_id: tenant.id,
      service_id: service1.id,
      min_notice_hours: 2,
      cancel_notice_hours: 1,
      buffer_minutes: 5
    }
  });

  const workingHour = await prisma.workingHour.findFirst({
    where: {
      tenant_id: tenant.id,
      praticien_id: praticien.id,
      weekday: 1,
      start_time: "09:00",
      end_time: "17:00"
    }
  });

  if (!workingHour) {
    await prisma.workingHour.create({
      data: {
        tenant_id: tenant.id,
        praticien_id: praticien.id,
        weekday: 1,
        start_time: "09:00",
        end_time: "17:00",
        is_active: true
      }
    });
  }

  const breakTime = await prisma.break.findFirst({
    where: {
      tenant_id: tenant.id,
      praticien_id: praticien.id,
      weekday: 1,
      start_time: "12:00",
      end_time: "13:00"
    }
  });

  if (!breakTime) {
    await prisma.break.create({
      data: {
        tenant_id: tenant.id,
        praticien_id: praticien.id,
        weekday: 1,
        start_time: "12:00",
        end_time: "13:00"
      }
    });
  }

  const timeOffStart = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const timeOffEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const timeOff = await prisma.timeOff.findFirst({
    where: {
      tenant_id: tenant.id,
      praticien_id: praticien.id,
      start_at: timeOffStart,
      end_at: timeOffEnd
    }
  });

  if (!timeOff) {
    await prisma.timeOff.create({
      data: {
        tenant_id: tenant.id,
        praticien_id: praticien.id,
        start_at: timeOffStart,
        end_at: timeOffEnd,
        reason: "Conference"
      }
    });
  }

  const holidayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10);
  const holiday = await prisma.holiday.findFirst({
    where: { tenant_id: tenant.id, date: holidayDate }
  });

  if (!holiday) {
    await prisma.holiday.create({
      data: {
        tenant_id: tenant.id,
        date: holidayDate,
        label: "Ferie"
      }
    });
  }

  const appointmentStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const appointmentEnd = new Date(
    appointmentStart.getTime() + service1.duration_minutes * 60000
  );

  const appointment =
    (await prisma.appointment.findFirst({
      where: {
        tenant_id: tenant.id,
        patient_id: patient1.id,
        praticien_id: praticien.id,
        date_heure_debut: appointmentStart
      }
    })) ??
    (await prisma.appointment.create({
      data: {
        tenant_id: tenant.id,
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

  const reminder = await prisma.notification.findFirst({
    where: { appointment_id: appointment.id, type: "reminder_24h" }
  });

  if (!reminder) {
    await prisma.notification.create({
      data: {
        tenant_id: tenant.id,
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

  await prisma.patient.update({
    where: { id: patient2.id },
    data: { notes_internes: "Follow-up next month" }
  });

  console.log("Seed completed:");
  console.log({
    tenant: tenant.slug,
    superAdminEmail: "superadmin@slotycare.test",
    adminEmail: admin.email,
    praticienEmail: praticien.email,
    password: "Password123!"
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
