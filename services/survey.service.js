"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {
    name: "survey",
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URI),
    collection: "surveys",

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
        getById: {
            async handler(ctx) {
                const {survey_id} = ctx.params;
                const survey = await this.getById(survey_id);
                const questions = await ctx.call('question.getBySurveyId', {survey_id});
                return {
                    ...survey,
                    questions: questions.map(({_id, text}) => ({
                        id: _id,
                        text,
                    })),
                };
            }
        },
        getAdminSurvey: {
            async handler(ctx) {
                const {survey_id} = ctx.params;
                await ctx.call("survey.checkSurveyAccess", {survey_id});
                const survey = await ctx.call('survey.getById', {survey_id})
                return survey;
            }
        },
        createSurvey: {
            params: {
                title: "string"
            },
            async handler(ctx) {
                const {title} = ctx.params;
                const new_survey = await this.adapter.insert({
                    title,
                    userId: ctx.meta.user._id,
                    timestamp: new Date(Date.now())
                });
                return new_survey;
            }
        },
        getList: {
            async handler(ctx) {
                const surveys = await ctx.call('survey.find', {
					query: {userId: ctx.meta.user._id},
					fields: ["_id", "name"]
                });
                return surveys;
            }
        },
        async checkSurveyAccess(ctx) {
            const survey = await this.adapter.findById(ctx.params.survey_id)
			const { meta: {user: {_id}} } = ctx;
			if (!survey || String(_id) !== String(survey.userId)) {
				throw new MoleculerClientError("Forbidden", 403, "Error");
			}
		},
        updateSurvey: {
            async handler(ctx) {
                const {survey_id, title} = ctx.params;
                await ctx.call("survey.checkSurveyAccess", {survey_id});
                await this.adapter.updateById(survey_id, {
                    $set: {
                        title
                    }
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
