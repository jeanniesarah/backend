"use strict";

const ApiGateway = require("moleculer-web");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,
		cors: {
			origin: '*',
			methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
			allowedHeaders: ["Origin", "X-Requested-With", "Accept", "Content-Type", "Authorization"],
			exposedHeaders: ["Authorization"],
			// credentials: false,
			maxAge: 3600,
		},
		// Rate limiter
		rateLimit: {
			window: 10 * 1000,
			limit: 10,
			headers: true
		},
		etag: true,

		path: "/",

		routes: [
			{
				path: "/api/survey",
				aliases: {
					"GET :survey_id": "survey.getById",
					"POST :survey_id": "answers.saveAnswers"
				},
				mappingPolicy: "restrict",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			}
	],

		// Serve assets from "public" folder
		assets: {
			folder: "public"
		}
	}
};
