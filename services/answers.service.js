"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const uuid = require("uuid");

module.exports = {
	name: "answers",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "answers",

	/**
     * Service settings
     */
	settings: {},

	/**
     * Service dependencies
     */
	dependencies: [],

	/**
     * Actions
     */
	actions: {

		saveAnswers: {
			params: {
				answers: "array"
			},
			async handler(ctx) {
				const {survey_id, answers, completedSurvey_id = uuid()} = ctx.params;
				for (let answer of answers) {
					const {id, text, value} = answer;
					await this.adapter.insert({
						surveyId: survey_id,
						completedSurveyId: String(completedSurvey_id),
						questionId: id,
						text,
						value,
						type: "boolean"
					});
				}
			}
		},
		getForCompletedSurvey: {
			async handler(ctx) {
				const {survey_id} = ctx.params;
				const answers = await ctx.call("answers.find", {
					query: {
						completedSurveyId: survey_id
					},
					fields: ["value", "questionId"]
				});
				return  answers;
			}
		}

	},

	/**
     * Events
     */
	events: {},

	/**
     * Methods
     */
	methods: {},

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
