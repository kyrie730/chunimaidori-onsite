import nodemailer, { type Transporter } from "nodemailer";

const globalForMailer = globalThis as unknown as { _mailer?: Transporter };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env.local`);
  return value;
}

export function getMailer(): Transporter {
  if (!globalForMailer._mailer) {
    globalForMailer._mailer = nodemailer.createTransport({
      host: required("SMTP_HOST"),
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_SECURE ?? "true") === "true",
      auth: { user: required("SMTP_USER"), pass: required("SMTP_PASS") },
      pool: true,
      maxConnections: 3,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }
  return globalForMailer._mailer;
}

export function getFrom() {
  return process.env.SMTP_FROM || required("SMTP_USER");
}
