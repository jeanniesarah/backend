"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const uuid = require("uuid");
const _ = require("lodash");

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
		},
		distinctBySurvey: {
			async handler(ctx) {
				const all = await this.adapter.find();
				const distinct = _.uniqBy(all, (item) => item.survey_id);
				return distinct.length;
			}
		},
		completions: {
			async handler(ctx) {
				console.log("completions");
				const all = await this.adapter.find();
				let surveys = {};
				for (let complete of all) {
					const survey = complete.survey_id;
					if (survey == "null") continue;
					if (!surveys[survey]) {
						surveys[survey] = {
							count: 1,
							survey: "https://public.getmetasurvey.com/?survey_id="+survey,
							owner: "https://api.getmetasurvey.com/api/sprt/owner?survey_id="+survey
						};
					} else {
						surveys[survey].count ++;
					}
				}
				surveys = _.sortBy(surveys, ["count", "survey"]);
				return surveys;
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
