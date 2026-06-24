const doctorCancellationEmail = (
  doctorName,
  patientName,
  appointmentDate,
  appointmentTime,
  bookingReference,
) => {
  return `
  <div style="font-family:Arial;padding:20px">

    <h2 style="color:#ff9800;">
      Appointment Cancelled
    </h2>

    <p>Dear <b>${doctorName}</b>,</p>

    <p>The following patient has cancelled the appointment.</p>

    <table>

      <tr>
        <td><b>Patient</b></td>
        <td>${patientName}</td>
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
        <td><b>Booking</b></td>
        <td>${bookingReference}</td>
      </tr>

    </table>

    <br>

    <hr>

    <small>
      Powered by <b>Nexora Technologies</b>
    </small>

  </div>
  `;
};

module.exports = doctorCancellationEmail;
