const cancellationEmail = (
  patientName,
  doctorName,
  appointmentDate,
  appointmentTime,
  bookingReference,
) => {
  return `
  <div style="font-family:Arial;padding:20px">

    <h2 style="color:#e53935;">
      Appointment Cancelled
    </h2>

    <p>Dear <b>${patientName}</b>,</p>

    <p>Your appointment has been cancelled successfully.</p>

    <table style="border-collapse:collapse;">
      <tr>
        <td><b>Doctor</b></td>
        <td>${doctorName}</td>
      </tr>

      <tr>
        <td><b>Date</b></td>
        <td>${appointmentDate}</td>
      </tr>

      <tr>
        <td><b>Time</b></td>
        <td>${appointmentTime}</td>
      </tr>

      <tr>
        <td><b>Booking ID</b></td>
        <td>${bookingReference}</td>
      </tr>
    </table>

    <br>

    <p>
      If payment was already completed, your refund will be processed shortly.
    </p>

    <br>

    <hr>

    <small>
      Powered by <b>Nexora Technologies</b>
    </small>

  </div>
  `;
};

module.exports = cancellationEmail;
