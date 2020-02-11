"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const uuid = require("uuid");
const Analytics = require("analytics-node");
const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);

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
				const questions = await ctx.call("question.getBySurveyId", {survey_id});
				const completedSurveys = await ctx.call("completedSurvey.getForSurvey", {survey_id});
				const results = [];
				console.log({completedSurveys});
				for (let completedSurvey of completedSurveys) {
					console.log({completedSurvey});
					const answers = await ctx.call("answers.getForCompletedSurvey", {survey_id: completedSurvey._id});
					results.push({...completedSurvey, ...{answers}});
				}
				console.log(results);
				for (let result of results) {
					const answers = questions.map(question => {
						const answ = result.answers.find((answer) => String(answer.questionId) === String(question._id));
						if (answ) {
							console.log(answ);
							return answ.value;
						} else {
							return null;
						}
					});
					result.answers = answers;
				}

				this.setAnalytic({user: ctx.meta.user}, "Looked at statistic", survey_id);

				return {
					questions,
					results,
					//answers
				};
			}
		},
		piechart: {
			async handler(ctx) {
				const {survey_id} = ctx.params;
				await ctx.call("survey.checkSurveyAccess", {survey_id});
				const questions = await ctx.call("question.getBySurveyId", {survey_id});
				const chart = [];
				for (let question of questions) {
					const yesCount = await ctx.call("answers.count", {
						query: {
							questionId: question._id,
							value: true
						}
					});
					chart.push({
						_id: question._id,
						text: question.text,
						yesCount
					});
				}
				return chart;
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
	methods: {
		setAnalytic({user}, event, survey_id) {
			const uid = user._id.toString();
			analytics.identify({
				userId: uid,
				traits: {
					email: user.email
				},
			});
			analytics.track({
				userId: uid,
				event,
				properties: {
					survey_id
				},
				timestamp: new Date(),
			});
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
