"use strict";

const ApiGateway = require("moleculer-web");
const E = require("moleculer-web").Errors;
const _ = require("lodash");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,
		httpServerTimeout: null,
		cors: {
			origin: "*",
			methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE", "PATCH"],
			allowedHeaders: ["Origin", "X-Requested-With", "Accept", "Content-Type", "Authorization"],
			exposedHeaders: ["Authorization"],
			// credentials: false,
			maxAge: 3600,
		},
		// Rate limiter
		/* 	rateLimit: {
			window: 10 * 1000,
			limit: 10,
			headers: true
		}, */
		etag: true,

		path: "/",

		routes: [
			{
				path: "/api/auth",
				aliases: {
					"POST register": "user.register",
					"POST login": "user.login",
					"POST password-recover": "user.recoverPassword",
					"GET regconfirm/:code": "user.confirmRegistration",
					"GET passwordChange/:token": "user.passwordChangeConfirm",
				},
				mappingPolicy: "restrict",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			},
			{
				path: "/api/sprt",
				aliases: {
					"GET users": "user.listAll",
					"GET stats-global-for-indie-hackers-top-secret": "user.globalStat",
					"GET owner": "survey.surveyOwner"
				},
				mappingPolicy: "restrict",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				},
				callOptions: {
					timeout: 60000
				}
			},
			{
				path: "/api/survey",
				aliases: {
					"GET :survey_id": "survey.getById",
					"POST :survey_id": "completedSurvey.create"
				},
				mappingPolicy: "restrict",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			},
			{
				path: "/api/admin",
				authorization: true,
				aliases: {
					"GET me": "user.me",
					"GET survey": "survey.getList",
					"GET survey/:survey_id": "survey.getAdminSurvey",
					"POST survey": "survey.create",
					"GET survey/:survey_id/question": "question.getBySurveyId",
					"PATCH survey/:survey_id/question/:question_id": "question.update",
					"DELETE survey/:survey_id/question/:question_id": "question.delete",
					"POST survey/:survey_id/question": "question.create",
					"PATCH survey/:survey_id": "survey.update",
					"DELETE survey/:survey_id": "survey.delete",
					"GET templates/clone/:survey_id": "survey.createTemplate",
					"GET /stat/:survey_id/piechart": "stat.piechart",
					"GET /stat/:survey_id/table": "stat.table",
					"POST upgrade": "user.upgrade",
					"POST cancel": "user.cancel"
				},
				mappingPolicy: "restrict",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			},
			{
				path: "/api/analytic",
				aliases: {
					"GET answer": "analytic.getSurveyAnswer",
					"GET /email/:survey_id": "analytic.getEmailBySurveyId",
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
	},
	methods: {
		async authorize (ctx, route, req) {
			let token;
			if (!req.headers.authorization) {
				throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
			}
	
			let type = req.headers.authorization.split(" ")[0];
			if (type !== "Bearer") {
				throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
			}
	
			token = req.headers.authorization.split(" ")[1];
			ctx.meta.token = token;
	
			const user = await ctx.call("user.resolveToken", { token });
			if (!user) {
				throw new E.UnAuthorizedError(E.ERR_INVALID_TOKEN);
			}
	
			if (route.opts.roles && !route.opts.roles.includes(user.role)) {
				throw new E.ForbiddenError();
			}
	
			ctx.meta.user = _.pick(user, ["_id", "email", "role", "isPro"]);
	

		}
	}
	
};
