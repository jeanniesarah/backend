"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

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
                console.log(questions);
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
                const survey = await this.getById(survey_id);
                return survey;
            }
        },
        createSurvey: {
            params: {
                name: "string",
                title: "string"
            },
            async handler(ctx) {
                const {name, title} = ctx.params;
                this.logger.info(ctx.meta.user)
                const new_survey = await this.adapter.insert({
                    name,
                    title,
                    userId: ctx.meta.user._id
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
			const survey = await ctx.call("survey.getById", {survey_id: ctx.params.survey_id});

			const { meta: {user: {_id}} } = ctx;
			if (_id !== survey.userId) {
				throw new MoleculerClientError("Forbidden", 403, "Error");
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
