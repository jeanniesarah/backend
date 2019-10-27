"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

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
				return await ctx.call("question.find", {
					query: {
						surveyId: survey_id,
						deletedAt: {$exists: false},
					},
					fields: ["_id", "text"]
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
				await ctx.call("survey.checkSurveyAccess", {survey_id});
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
				await ctx.call("survey.checkSurveyAccess", {survey_id});
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
				await ctx.call("survey.checkSurveyAccess", {survey_id});
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
