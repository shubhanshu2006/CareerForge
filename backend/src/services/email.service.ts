import SibApiV3Sdk from "sib-api-v3-sdk";
import { getTransactionalEmailApi } from "../config/brevo.js";
import { ApiError } from "../utils/ApiError.js";
import {
  findJobForEmail,
  findJobsForEmail,
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
  accentColor?: string;
}) => {
  const year = new Date().getFullYear();
  const accent = input.accentColor || "#f97316";
  const accentDark = "#ea580c";
  const ctaHtml = input.cta
    ? `<div style="text-align: center; margin: 36px 0 8px;">
          <a href="${input.cta.url}" style="background: linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%); color: #ffffff; padding: 16px 44px; border-radius: 50px; text-decoration: none; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 8px 24px rgba(249, 115, 22, 0.35); letter-spacing: 0.02em;">
            ${input.cta.label} &nbsp;→
          </a>
        </div>`
    : "";
  const infoHtml = input.infoHtml
    ? `<div style="background: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid ${accent}; padding: 16px 20px; border-radius: 8px; margin: 28px 0;">
          <p style="margin: 0; color: #7c2d12; font-size: 14px; line-height: 1.6;">
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0a0a0b;">
  <div style="width: 100%; max-width: 620px; margin: 0 auto; padding: 32px 16px;">

    <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);">

      <!-- Hero header -->
      <div style="background: radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.25), transparent 50%), linear-gradient(135deg, #0f0f12 0%, #1a1a1f 100%); padding: 48px 32px 56px; text-align: center; position: relative;">
        <div style="display: inline-block; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 999px; padding: 6px 16px; margin-bottom: 20px;">
          <span style="color: ${accent}; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">⚡ Welcome aboard</span>
        </div>
        <h1 style="margin: 0; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; line-height: 1.1;">${input.title}</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px 36px; color: #1f2937; line-height: 1.7; background: #ffffff;">

        <!-- Greeting -->
        <p style="margin: 0 0 6px; font-size: 15px; color: #6b7280; font-weight: 500;">Hey there 👋</p>
        <h2 style="margin: 0 0 24px; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.01em;">${input.greetingName}, welcome to CareerForge.</h2>

        ${input.bodyHtml}

        ${ctaHtml}

        <!-- Signature -->
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">With excitement,</p>
          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #111827;">Shubhanshu Singh</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #9ca3af;">Founder, CareerForge</p>
        </div>

        ${infoHtml}
      </div>

      <!-- Footer -->
      <div style="background: #0f0f12; padding: 28px 32px; text-align: center; color: #6b7280; font-size: 13px;">
        <p style="margin: 0; color: #ffffff; font-weight: 700; font-size: 15px; letter-spacing: -0.01em;">
          Career<span style="color: ${accent};">Forge</span>
        </p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #6b7280;">
          © ${year} CareerForge. Built to get you hired.
        </p>
        <p style="margin: 12px 0 0; font-size: 11px; color: #4b5563;">
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

  const firstName = (user.username || "there").split(/[\s_]+/)[0] || "there";
  const dashboardUrl = `${(process.env.APP_URL || "https://careerforge.ai").replace(/\/$/, "")}/dashboard`;

  const bodyHtml = `
    <p style="margin: 0 0 18px; font-size: 16px; color: #374151; line-height: 1.7;">
      I'm <strong style="color: #111827;">Shubhanshu Singh</strong>, the founder of CareerForge — and I'm genuinely thrilled to have you here. You just took the first step toward never missing the right opportunity again.
    </p>

    <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.7;">
      Here's what you can do right now:
    </p>

    <div style="background: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 0 0 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
            <span style="color: ${"#f97316"}; font-weight: 700; margin-right: 8px;">✦</span> Set your preferences — roles, locations, and comp range
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
            <span style="color: ${"#f97316"}; font-weight: 700; margin-right: 8px;">✦</span> Get alerts in <strong>&lt; 5 minutes</strong> of new postings
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
            <span style="color: ${"#f97316"}; font-weight: 700; margin-right: 8px;">✦</span> Track every application, note, and status in one place
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
            <span style="color: ${"#f97316"}; font-weight: 700; margin-right: 8px;">✦</span> Practice with AI-powered interview analysis
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.7;">
      The early bird really does get the role — our data shows early applicants are <strong style="color: #111827;">4× more likely</strong> to land an interview. Let's make sure you're always early.
    </p>
  `;

  await sendEmail({
    to: { email: user.email, name: user.username },
    subject: `Welcome to CareerForge, ${firstName}! ⚡`,
    htmlContent: renderEmailTemplate({
      title: "You're in. Let's get you hired.",
      greetingName: firstName,
      bodyHtml,
      cta: {
        label: "Open your dashboard",
        url: dashboardUrl,
      },
      infoHtml:
        "If you didn't create this account, you can safely ignore this email — no action needed.",
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

export const sendJobAlertDigestEmail = async (input: {
  userId: number;
  topJobIds: number[];
}) => {
  const [user, jobs] = await Promise.all([
    findUserForEmail(input.userId),
    findJobsForEmail(input.topJobIds),
  ]);

  if (!user || !user.email) {
    throw new ApiError(404, "User email not found");
  }
  if (jobs.length === 0) return; // all jobs may have been deleted

  const appUrl = (process.env.APP_URL || "https://careerforge.ai").replace(/\/$/, "");
  const alertsUrl = `${appUrl}/for-you`;

  // Sort jobs back into the original topJobIds order (preserves score rank)
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const ordered = input.topJobIds
    .map((id) => jobMap.get(id))
    .filter((j): j is NonNullable<typeof j> => Boolean(j));

  const firstName = (user.username || "there").split(/[\s_]+/)[0] || "there";
  const totalShown = ordered.length;

  const jobRowsHtml = ordered
    .map(
      (job, i) => `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #f3f4f6;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                <span style="display: inline-block; width: 22px; height: 22px; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.25); border-radius: 6px; text-align: center; font-size: 11px; font-weight: 700; color: #f97316; line-height: 22px;">${i + 1}</span>
              </td>
              <td style="padding-left: 12px;">
                <a href="${job.applyUrl}" style="font-size: 15px; font-weight: 700; color: #111827; text-decoration: none; line-height: 1.3; display: block;">${job.title}</a>
                <span style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                  ${job.company}${job.location ? ` &nbsp;·&nbsp; ${job.location}` : ""}${job.isRemote ? " &nbsp;·&nbsp; Remote" : ""}
                </span>
              </td>
              <td style="width: 80px; text-align: right; vertical-align: middle; padding-left: 8px;">
                <a href="${job.applyUrl}" style="display: inline-block; background: #f97316; color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; text-decoration: none; white-space: nowrap;">Apply →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("");

  const bodyHtml = `
    <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.7;">
      We found <strong style="color: #111827;">${totalShown} new role${totalShown !== 1 ? "s" : ""}</strong> matching your preferences. Here are the top picks, ranked by relevance:
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 8px;">
      ${jobRowsHtml}
    </table>

    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      These are your top ${totalShown} matches. See all your alerts in the app.
    </p>
  `;

  await sendEmail({
    to: { email: user.email, name: user.username },
    subject: `⚡ ${totalShown} new job${totalShown !== 1 ? "s" : ""} match your preferences`,
    htmlContent: renderEmailTemplate({
      title: `${totalShown} New Job${totalShown !== 1 ? "s" : ""} For You`,
      greetingName: firstName,
      bodyHtml,
      cta: {
        label: "See all your alerts",
        url: alertsUrl,
      },
      infoHtml:
        "You're receiving this because you have job alerts enabled. You can turn them off in your preferences.",
    }),
  });

  // Mark all shown jobs as emailed
  await Promise.all(
    ordered.map((job) =>
      markJobAlertEmailed({ userId: input.userId, jobId: job.id }),
    ),
  );
};
