const passwordResetEmail = (name, otp) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:10px;">
      
      <h2 style="color:#2563eb;text-align:center;">
        🔐 Reset Your SehatRaj Password
      </h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>
        We received a request to reset your SehatRaj account password.
      </p>

      <p style="text-align:center;font-size:34px;font-weight:bold;color:#16a34a;letter-spacing:6px;">
        ${otp}
      </p>

      <p>
        This OTP is valid for <strong>10 minutes</strong>.
      </p>

      <p>
        If you didn't request a password reset, simply ignore this email.
      </p>

      <hr>

      <p style="text-align:center;color:gray;font-size:13px;">
        SehatRaj <br/>
        Powered by Qurenix Technologies Pvt. Ltd.
      </p>

    </div>
  `;
};

module.exports = passwordResetEmail;
