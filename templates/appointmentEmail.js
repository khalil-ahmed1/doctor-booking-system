const appointmentEmail = (
  patientName,
  doctorName,
  bookingReference,
  appointmentDate,
  appointmentTime,
) => {
  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body{
font-family:Arial,sans-serif;
background:#f5f7fb;
padding:30px;
}

.container{
max-width:700px;
margin:auto;
background:white;
border-radius:12px;
overflow:hidden;
box-shadow:0 10px 30px rgba(0,0,0,.1);
}

.header{
background:#2563eb;
color:white;
padding:30px;
text-align:center;
}

.logo{
font-size:30px;
font-weight:bold;
}

.content{
padding:35px;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

td{
padding:12px;
border-bottom:1px solid #eee;
}

.footer{
padding:25px;
background:#fafafa;
text-align:center;
font-size:13px;
color:#666;
}

.button{
display:inline-block;
padding:14px 30px;
background:#2563eb;
color:white;
text-decoration:none;
border-radius:8px;
margin-top:25px;
font-weight:bold;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<div class="logo">

NEXORA TECHNOLOGIES

</div>

<h2>Appointment Confirmation</h2>

</div>

<div class="content">

<h3>Hello ${patientName},</h3>

<p>Your appointment has been booked successfully.</p>

<table>

<tr>

<td><strong>Booking ID</strong></td>

<td>${bookingReference}</td>

</tr>

<tr>

<td><strong>Doctor</strong></td>

<td>${doctorName}</td>

</tr>

<tr>

<td><strong>Date</strong></td>

<td>${appointmentDate}</td>

</tr>

<tr>

<td><strong>Time</strong></td>

<td>${appointmentTime}</td>

</tr>

</table>

<center>

<a href="#" class="button">

View Appointment

</a>

</center>

</div>

<div class="footer">

<b>Nexora Technologies</b>

<br><br>

Building Smart Healthcare Solutions

<br><br>

Rajouri • Jammu & Kashmir

</div>

</div>

</body>

</html>

`;
};

module.exports = appointmentEmail;
