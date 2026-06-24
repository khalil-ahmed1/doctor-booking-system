const { sendEmail } = require("../services/emailService");

const testEmail = async (req, res) => {
  try {
    const { email } = req.body;

    await sendEmail({
      to: email,
      subject: "Doctor Booking System Test",
      html: `
        <h2>Welcome!</h2>

        <p>This is a test email from your Doctor Booking System.</p>

        <p>Your email service is working successfully.</p>

        <hr>

        <h3>Nexora Technologies</h3>
      `,
    });

    res.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  testEmail,
};
