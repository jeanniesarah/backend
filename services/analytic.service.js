"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

module.exports = {
	name: "analytic",
	mixins: [DbService],
	adapter: new MongoDBAdapter(process.env.MONGO_URI),
	collection: "analytics",

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
		/**
		 * GET survej json from db by _id
		 *
		 * @returns
		 */
		getSurveyAnswer: {
			async handler(ctx) {
				let arAnswers = [];
				const surveys = await ctx.call("survey.find", {
					query: {
						deletedAt: {$exists: false},
					},
					fields: ["_id"]
				});
				const completedSurveys = await ctx.call("completedSurvey.find", {
					fields: ["survey_id"]
				});

				for (let survey of surveys) {
					let count = 0;
					for (let completedSurvey of completedSurveys) {
						if (survey._id === completedSurvey.survey_id) {
							count++;
						}
					}
					arAnswers.push({
						survey_id: survey._id,
						count_answers: count
					});
				}

				return arAnswers;
			}
		},
		getEmailBySurveyId: {
			async handler(ctx) {
				const {survey_id} = ctx.params;
				// await ctx.call("survey.checkSurveyAccess", {survey_id});
				const survey = await ctx.call("survey.getById", {survey_id});
				const user = await ctx.call("user.getById", {user_id: survey.userId});

				return {
					survey_id: survey_id,
					email: user.email
				};
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
