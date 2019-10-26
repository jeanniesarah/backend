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
		async sendConfirmaitionLink(ctx) {
			const {to, link} = ctx.params;
			this.logger.info({to, link});
			await transporter.sendMail({
				from: from_email, // sender address
				to: to, // list of receivers
				subject: "Registration confirmation", // Subject line
				//text: "", // plain text body
				html: `${link}`// html body
			});
		},
		async sendPasswordRecoveryToken(ctx) {
			const {to, link} = ctx.params;
			this.logger.info({to, link});
			await transporter.sendMail({
				from: from_email, // sender address
				to: to, // list of receivers
				subject: "Password recovery", // Subject line
				//text: "", // plain text body
				html: `${link}`// html body
			});
		},
		async sendNewPassword(ctx) {
			const {to, password} = ctx.params;
			this.logger.info({to, password});
			await transporter.sendMail({
				from: from_email, // sender address
				to: to, // list of receivers
				subject: "New temporary password", // Subject line
				//text: "", // plain text body
				html: `Your tmp password: ${password} <br/>`// html body
			});
		}
	}
};