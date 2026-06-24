const reminderEmail = (
  patientName,
  doctorName,
  appointmentDate,
  appointmentTime,
) => {
  return `
<!DOCTYPE html>

<html>

<body style="font-family:Arial;background:#f5f5f5;padding:30px">

<div style="max-width:700px;margin:auto;background:white;padding:40px;border-radius:10px">

<h2 style="color:#2563eb">
Appointment Reminder
</h2>

<p>Hello <b>${patientName}</b>,</p>

<p>This is a reminder that you have an upcoming appointment.</p>

<table style="width:100%;border-collapse:collapse">

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

</table>

<br>

<p>
Please arrive 10 minutes before your appointment.
</p>

<hr>

<center>

<b>Nexora Technologies</b>

<br>

Smart Healthcare Solutions

</center>

</div>

</body>

</html>

`;
};

module.exports = reminderEmail;
