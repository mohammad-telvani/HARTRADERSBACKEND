const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const otpStore = {};
const verifiedDevicesPath = path.join(__dirname, 'verifiedDevices.json');

// Load verified devices
let verifiedDevices = {};
if (fs.existsSync(verifiedDevicesPath)) {
  verifiedDevices = JSON.parse(fs.readFileSync(verifiedDevicesPath));
}

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mohammadtelvani9428@gmail.com',
    pass: 'uowp epmq uucq flud', // Replace with your app-specific password
  },
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Endpoint to send OTP
app.post('/send-otp', (req, res) => {
  const { deviceId, email } = req.body;

  // Check if the device is already verified
  if (verifiedDevices[deviceId]) {
    return res.status(200).send('Device already verified');
  }

  const otp = generateOTP();
  otpStore[deviceId] = otp;

  const mailOptions = {
    from: 'mohammadtelvani9428@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  console.log(`Sending OTP: ${otp} to email: ${email}`);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('Email sent:', info.response);
    res.status(200).send('OTP sent');
  });
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { deviceId, otp } = req.body;
  console.log(`Verifying OTP for device: ${deviceId} with OTP: ${otp}`);

  if (otpStore[deviceId] && otpStore[deviceId] === otp) {
    console.log('OTP verified');
    delete otpStore[deviceId];

    // Mark device as verified
    verifiedDevices[deviceId] = true;
    fs.writeFileSync(verifiedDevicesPath, JSON.stringify(verifiedDevices));

    res.status(200).send('OTP verified');
  } else {
    console.log('Invalid OTP');
    res.status(400).send('Invalid OTP');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
