const host = process.env.MAIL_HOST;
const port = process.env.MAIL_PORT;
const smtp_user = process.env.SMTP_USER;
const smtp_password = process.env.SMTP_PASSWORD;
const from_email = process.env.FROM_EMAIL;

const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
	host,
	port,
	secure: false, // true for 465, false for other ports
	auth: {
		user: smtp_user, // generated ethereal user
		pass: smtp_password // generated ethereal password
	}
});



module.exports = {
	name: "mail",
	actions: {
		async sendConfirmaitionLink({to, link}) {
			await transporter.sendMail({
				from: from_email, // sender address
				to: to, // list of receivers
				subject: "Registration confirmation", // Subject line
				text: "", // plain text body
				html: "<b>link?</b>" // html body
			});
		}
	}
};