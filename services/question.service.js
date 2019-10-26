"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {
	name: "question",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "questions",

	/**
	 * Service settings
	 */
	settings: {},

	/**
	 * Service dependencies
	 */
	dependencies: ["survey"],

	/**
	 * Actions
	 */
	actions: {
		getBySurveyId: {
			params: {
				survey_id: "string",
			},
			async handler(ctx) {
				const { survey_id } = ctx.params;
				await this.checkSurveyAccess(ctx, survey_id);
				return await this.adapter.find({
					surveyId: survey_id,
					deletedAt: {"$exists": false},
				});
			}
		},
		create: {
			params: {
				survey_id: "string",
				text: "string",
			},
			async handler(ctx) {
				const {survey_id, text} = ctx.params;
				await this.checkSurveyAccess(ctx, survey_id);
				return await this.adapter.insert({
					text,
					surveyId: survey_id,
					createdAt: new Date(),
				});
			}
		},
		update: {
			params: {
				question_id: "string",
				text: "string",
			},
			async handler(ctx) {
				const { question_id, text, survey_id  } = ctx.params;
				await this.checkSurveyAccess(ctx, survey_id);
				return await this.adapter.updateById(question_id, {
					"$set": {
						text: text,
						updatedAt: new Date(),
					}
				});
			}
		},

		delete: {
			params: {
				question_id: "string",
			},
			async handler(ctx) {
				const { question_id, survey_id } = ctx.params;
				await this.checkSurveyAccess(ctx, survey_id);
				return await this.adapter.updateById(question_id, {
					"$set": {
						deletedAt: new Date(),
					}
				});
			}
		},
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		async checkSurveyAccess(ctx, surveyId) {
			const survey = await ctx.call("survey.getById", {survey_id: surveyId});
			console.log(survey);

			const { meta: {user: {userId}} } = ctx;
			if (userId !== survey.userId) {
				throw new MoleculerClientError("Forbidden", 403, "Error");
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
