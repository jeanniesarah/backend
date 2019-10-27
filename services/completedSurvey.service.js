"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const uuid = require("uuid");

module.exports = {
	name: "completedSurvey",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "completedSurvey",

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

		create: {
			params: {
				answers: "array",
				survey_id: "string"
			},
			async handler(ctx) {
				const {survey_id, answers, comment } = ctx.params;
				const completedSurvey = await this.adapter.insert({
					survey_id,
					respondentUuid: uuid(),
					comment,
					createdAt: new Date(Date.now())
				});
				await ctx.call("answers.saveAnswers", {
					completedSurvey_id: completedSurvey._id,
					survey_id,
					answers
				});
			}
		},
		getForSurvey: {
			async handler(ctx) {
				const {survey_id} = ctx.params;
				return await ctx.call("completedSurvey.find", {
					query: {
						survey_id: survey_id,
					},
					fields: ["_id", "respondentUuid", "comment", "createdAt"]
				});
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
