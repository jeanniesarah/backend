"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const uuid = require("uuid");

module.exports = {
	name: "stat",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "stats",

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
		table: {
			async handler(ctx) {
				const {survey_id} = ctx.params;
				await ctx.call("survey.checkSurveyAccess", {survey_id});
				const completedSurveys = await ctx.call("completedSurvey.getForSurvey", {survey_id});
				const result = await Promise.all(completedSurveys.map(async (completedSurvey) => {
          const answers = await ctx.call("answers.getForCompletedSurvey", {survey_id: completedSurvey._id});
          return {...completedSurvey, ...{answers}}
				}));
				return result;
			}
		},
		piechart: {
			async handler(ctx) {
				const {survey_id} = ctx.params;
				await ctx.call("survey.checkSurveyAccess", {survey_id});
				const responses = await ctx.call("completedSurvey.getForSurvey", {survey_id});
				return responses;
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
