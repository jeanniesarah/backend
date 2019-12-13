"use strict";

const uuid = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const passwordGenerator = require("generate-password");
const E = require("moleculer-web").Errors;

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { MoleculerClientError } = require("moleculer").Errors;
const _ = require("lodash");

module.exports = {
	name: "user",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "users",

	/**
	 * Service settings
	 */
	settings: {
		jwt_secret: process.env.JWT_SECRET || "secret",
		jwtExpireInDays: process.env.JWT_EXPIRE_IN_DAYS || 12
	},

	/**
	 * Service dependencies
	 */
	dependencies: [],	

	/**
	 * Actions
	 */
	actions: {
		register: {
			params: {
				email: "email",
				password: "string"
			},
			async handler(ctx) {
				const {email, password} = ctx.params;
				const isUnique = await this.isUnique({email});
				this.logger.info({isUnique});
				if (!isUnique) {
					throw new MoleculerClientError("User exists", 422, "Error");
				}
				const emailConfirmationCode = uuid();

				const new_user = {
					email,
					password: this.cryptPassword(password),
					status: 0,
					activationCode: emailConfirmationCode,
					role: "customer",
					isPro: false
				};

				const user = await this.adapter.insert(new_user);

				const activation_link = `https://app.${process.env.HOST}/#/info?regconfirm=${emailConfirmationCode}`;

				ctx.call("mail.sendConfirmaitionLink", {
					to: email,
					link: activation_link
				});

				const jwtToken = this.genToken(user._id);
				return {
					jwtToken,
					role: user.role
				};
			}
		},
		confirmRegistration: {
			params: {
				code: "string"
			},
			async handler(ctx) {
				const {code} = ctx.params;
				const user = await this.adapter.findOne({
					activationCode: code
				});
				if (!user) {
					throw new MoleculerClientError("Activation code not valid", 422, "Error");
				}
				this.adapter.updateById(user._id, {
					$set: {
						status:1
					},
					$unset: {
						activationCode: true
					}
				});
			}
		},
		login: {
			params: {
				email: "string",
				password: "string"
			},
			async handler(ctx) {
				const {email, password} = ctx.params;
				const user = await this.checkAuthData(email, password);
				this.logger.info({user});
				const jwtToken = this.genToken(user._id);
				return {
					jwtToken,
					role: user.role
				};
			}
		},
		recoverPassword: {
			params: {
				email: "email"
			},
			async handler(ctx) {
				const {email} = ctx.params;
				const user = await this.adapter.findOne({email});
				this.logger.info(user);
				if (!user) return;
				// генерим рандомный токен для подтверждения действия
				const token = passwordGenerator.generate({
					length: 100,
					numbers: true
				});

				// пишем его в базу, будем сравнивать при переходе по ссылке
				this.adapter.updateById(
					user._id, 
					{
						$set: {
							passwordRecoveryToken: token
						}
					}
				);

				const recovery_link = `https://app.${process.env.HOST}/#/info?recovery=${token}`;

				ctx.call("mail.sendPasswordRecoveryToken", {
					to: email,
					link: recovery_link
				});
			}
		},
		passwordChangeConfirm: {
			params: {
				token: {
					type: "string"
				}
			},
			async handler(ctx){
				const {token} = ctx.params;
				const user = await this.adapter.findOne({
					passwordRecoveryToken: token
				});
				if (!user) {
					throw new MoleculerClientError("Recovery code not vaild", 422, "Error");
				}

				const plain_password = passwordGenerator.generate({
					length: 10,
					numbers: true
				});

				const password = this.cryptPassword(plain_password);

				await this.adapter.updateById(user._id, {
					$set: {
						password
					},
					$unset: {
						passwordRecoveryToken: true
					}
				});

				ctx.call("mail.sendNewPassword", {
					to: user.email,
					password: plain_password
				});


			}
		},
		resolveToken: {
			params: {
				token: "string",
				user: { optional: true, type: "object" }
			},
			async handler(ctx) {
				let { token } = ctx.params;
				let user;
				let jwtDecoded;
				try {
					jwtDecoded = jwt.verify(token, this.settings.jwt_secret);
				} catch (error) {
					throw new E.UnAuthorizedError(E.ERR_INVALID_TOKEN);
				}

				const id = jwtDecoded.id;
				if (!id) {
					throw new E.UnAuthorizedError(E.ERR_INVALID_TOKEN);
				}

				user = await this.adapter.findById(id);
				if (!user ) {
					throw new E.UnAuthorizedError(E.ERR_INVALID_TOKEN);
				}

				// await this.broker.cacher.set(id, user, 86400);
				return user;
			}
		},
		me: {
			async handler(ctx) {
				return ctx.meta.user;
			}
		},
		upgrade: {
			async handler(ctx) {
				const {user} = ctx.meta;
				return await this.adapter.updateById(user._id, {
					"$set": {
						isPro: true
					}
				});
			}
		},
		cancel: {
			async handler(ctx) {
				const {user} = ctx.meta;
				return await this.adapter.updateById(user._id, {
					"$set": {
						isPro: false
					}
				});
			}
		},
		getPro: {
			async handler(ctx) {
				const {user_id} = ctx.params;
				const user = await this.adapter.getById(user_id);

				return _.pick(user, ["isPro"]);
			}
		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {
		async isUnique({email}) {
			const count = await this.adapter.count({query: {email}});
			console.log(count);
			return count == 0;
		},
		cryptPassword(plainPassword) {
			return crypto.scryptSync(plainPassword, this.settings.jwt_secret, 64).toString("hex");
		},
		genToken(id) {
			const { jwtExpireInDays } = this.settings;
			const today = new Date();
			const exp = new Date(today);
			exp.setDate(today.getDate() + jwtExpireInDays);
			const jwtParams = {
				exp: Math.floor(exp.getTime() / 1000),
				id
			};
			return jwt.sign(jwtParams, process.env.JWT_SECRET);
		},
		async checkAuthData(email, password, admin = false) {
		//	this.logger.info("check auth data", { email, password, admin });
			if (admin) {
				const adminData = (process.env.ADMIN_USER).split(":");
				const adminLogin = adminData[0];
				const adminPassword = adminData[1];

				if (!(email === adminLogin && this.cryptPassword(password) === adminPassword)) {
					throw new MoleculerClientError("Login or password is invalid", 422, "Authorization error");
				}
				return { adminLogin };
			} else {
				const user = await this.adapter.findOne({email});
				//this.logger.info({user});
				if (!(user && this.cryptPassword(password) === user.password)) {
					throw new MoleculerClientError("Email or password is invalid", 422, "Error");
				}
				return user;
			}
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};