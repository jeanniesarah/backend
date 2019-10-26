"use strict";

const uuid = require("uuid");
const crypto = require("crypto");

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {
	name: "user",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "users",

	/**
	 * Service settings
	 */
	settings: {
		jwt_secret: process.env.JWT_SECRET || "secret"
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
				if (!this.isUnique({email})) {
					throw new MoleculerClientError("User exists", 422, "Error");
				}
				const emailConfirmationCode = uuid();

				const newUser = {
					email,
					password: this.cryptPassword(password),
					status: 0,
					activation_code: emailConfirmationCode,
					role: "customer"
				};

				const activation_link = `https://app.${process.env.HOST}/#/info?regconfirm=${emailConfirmationCode}`;

				this.logger.info({email, activation_link});
				ctx.call("mail.sendConfirmaitionLink", {
					to: email,
					link: activation_link
				});
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
			const count = await this.adapter.count({email});
			return count > 0;
		},
		cryptPassword(plainPassword) {
			return crypto.scryptSync(plainPassword, this.settings.jwt_secret, 64).toString("hex");
		},
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