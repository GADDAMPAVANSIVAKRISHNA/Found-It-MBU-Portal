const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

console.log('--- Testing Email Configuration ---');
console.log(`User: ${emailUser}`);
console.log(`Pass: ${emailPass ? '******** (Loaded)' : 'NOT LOADED'}`);

if (!emailUser || !emailPass) {
    console.error('❌ Error: EMAIL_USER or EMAIL_PASS not found in .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: emailUser,
        pass: emailPass,
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        console.log('Attempting to connect to Outlook/Office365...');
        await transporter.verify();
        console.log('✅ Connection Successful! Credentials are correct.');

        console.log('Sending test email...');
        await transporter.sendMail({
            from: emailUser,
            to: emailUser, // Send to self
            subject: "Test Email from MBU Portal",
            text: "If you see this, email is working!"
        });
        console.log('✅ Test email sent successfully to ' + emailUser);
    } catch (err) {
        console.error('❌ Login Failed:', err.message);
        if (err.responseCode === 535) {
            console.log('\n--- TROUBLESHOOTING ---');
            console.log('1. Check if your password is correct.');
            console.log('2. If you have 2FA/MFA enabled, you MUST use an "App Password" instead of your regular password.');
            console.log('3. Your university admin might have disabled "Authenticated SMTP" for students.');
        }
    }
}

test();
