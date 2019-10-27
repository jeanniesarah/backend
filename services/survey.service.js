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
