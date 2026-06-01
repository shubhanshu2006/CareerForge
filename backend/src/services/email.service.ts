import SibApiV3Sdk from "sib-api-v3-sdk";
import { getTransactionalEmailApi } from "../config/brevo.js";
import { ApiError } from "../utils/ApiError.js";
import {
  findJobForEmail,
  findUserForEmail,
  markJobAlertEmailed,
} from "../repositories/email.repository.js";

const getFromEmail = () => {
  return process.env.BREVO_SENDER_EMAIL || "no-reply@careerforge.ai";
};

const getFromName = () => {
  return process.env.BREVO_SENDER_NAME || "CareerForge";
};

const sendEmail = async (payload: {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
}) => {
  const sender = {
    email: getFromEmail(),
    name: getFromName(),
  };

  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.sender = sender;
  email.to = [payload.to];
  email.subject = payload.subject;
  email.htmlContent = payload.htmlContent;

  await getTransactionalEmailApi().sendTransacEmail(email);
};

const renderEmailTemplate = (input: {
  title: string;
  greetingName: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  infoHtml?: string;
}) => {
  const year = new Date().getFullYear();
  const ctaHtml = input.cta
    ? `<div style="text-align: center; margin: 35px 0;">
          <a href="${input.cta.url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            ${input.cta.label}
          </a>
        </div>`
    : "";
  const infoHtml = input.infoHtml
    ? `<div style="background: #fff9e6; border-left: 4px solid #fbbf24; padding: 20px; border-radius: 6px; margin: 25px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ${input.infoHtml}
          </p>
        </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${input.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 700;">${input.title}</h1>
      </div>

      <div style="padding: 40px 20px; color: #333333; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; margin-bottom: 30px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Hello ${input.greetingName}!</h2>
        </div>

        ${input.bodyHtml}

        ${ctaHtml}

        ${infoHtml}
      </div>

      <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 25px 20px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 3px solid #667eea;">
        <p style="margin: 0;">
          © ${year} <strong style="color: #ffffff;">CareerForge</strong>. All rights reserved.
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px;">
          This is an automated email — please do not reply.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const sendWelcomeEmail = async (userId: number) => {
  const user = await findUserForEmail(userId);
  if (!user || !user.email) {
    throw new ApiError(404, "User email not found");
  }

  await sendEmail({
    to: { email: user.email, name: user.username },
    subject: "Welcome to CareerForge",
    htmlContent: renderEmailTemplate({
      title: "Welcome to CareerForge",
      greetingName: user.username,
      bodyHtml: `<p style="margin: 20px 0; font-size: 16px; color: #555;">Welcome to CareerForge. You are all set to start tracking jobs, interviews, and opportunities.</p>
        <p style="margin: 20px 0; font-size: 16px; color: #555;">Your dashboard is ready, and job alerts will start as soon as matches appear.</p>`,
      cta: {
        label: "Open Dashboard",
        url: process.env.APP_URL || "https://careerforge.ai",
      },
      infoHtml:
        "If you did not create this account, you can ignore this email.",
    }),
  });
};

export const sendVerificationEmail = async (input: {
  userId: number;
  token: string;
}) => {
  const user = await findUserForEmail(input.userId);
  if (!user || !user.email) {
    throw new ApiError(404, "User email not found");
  }

  const baseUrl = process.env.APP_URL || "";
  const verificationUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/verify-email?token=${input.token}`
    : `verify-email?token=${input.token}`;

  await sendEmail({
    to: { email: user.email, name: user.username },
    subject: "Verify your CareerForge email",
    htmlContent: renderEmailTemplate({
      title: "Verify Your Email",
      greetingName: user.username,
      bodyHtml: `<p style="margin: 20px 0; font-size: 16px; color: #555;">Please verify your email address to activate your CareerForge account.</p>
        <p style="margin: 20px 0; font-size: 16px; color: #555;">This helps us keep your account secure and ensures you receive job alerts.</p>`,
      cta: {
        label: "Verify Email Address",
        url: verificationUrl,
      },
      infoHtml:
        "This link will expire in <strong>24 hours</strong>. If you did not sign up, you can safely ignore this email.",
    }),
  });
};

export const sendJobAlertEmail = async (input: {
  userId: number;
  jobId: number;
}) => {
  const [user, job] = await Promise.all([
    findUserForEmail(input.userId),
    findJobForEmail(input.jobId),
  ]);

  if (!user || !user.email) {
    throw new ApiError(404, "User email not found");
  }
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const location = job.location ? ` (${job.location})` : "";

  await sendEmail({
    to: { email: user.email, name: user.username },
    subject: `New ${job.title} role at ${job.company}`,
    htmlContent: renderEmailTemplate({
      title: "New Job Alert",
      greetingName: user.username,
      bodyHtml: `<p style="margin: 20px 0; font-size: 16px; color: #555;">A new job matching your preferences is live:</p>
        <p style="margin: 20px 0; font-size: 18px; color: #111827;"><strong>${job.title}</strong> at <strong>${job.company}</strong>${location}</p>`,
      cta: {
        label: "Apply Now",
        url: job.applyUrl,
      },
      infoHtml:
        "Act quickly to maximize your chances. If you already applied, you can safely ignore this email.",
    }),
  });

  await markJobAlertEmailed({
    userId: input.userId,
    jobId: input.jobId,
  });
};
