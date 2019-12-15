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
                console.log('get bu id')
                const {survey_id} = ctx.params;
                const survey = await this.getById(survey_id);
                const questions = await ctx.call('question.getBySurveyId', {survey_id});
                const user = await ctx.call('user.getPro', {user_id: survey.userId})
                console.log('user', user)
                return {
                    ...survey,
                    questions: questions.map(({_id, text, imageSrc}) => ({
                        id: _id,
                        text,
                        imageSrc
                    })), 
                    user
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
        create: {
            params: {
                title: "string"
            },
            async handler(ctx) {
                const {title} = ctx.params;
                const new_survey = await this.adapter.insert({
                    title,
                    userId: ctx.meta.user._id,
                    createdAt: new Date()
                });
                return new_survey;
            }
        },
        getList: {
            async handler(ctx) {
                const surveys = await ctx.call('survey.find', {
					query: {
					    userId: ctx.meta.user._id,
                        deletedAt: {$exists: false},
                    },
                    fields: ["_id", "title"]
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
        update: {
            async handler(ctx) {
                const {survey_id, title} = ctx.params;
                await ctx.call("survey.checkSurveyAccess", {survey_id});
                await this.adapter.updateById(survey_id, {
                    $set: {
                        title
                    }
                });
            }
        },
        delete: {
            async handler(ctx) {
                const {survey_id} = ctx.params;
                await ctx.call("survey.checkSurveyAccess", {survey_id});
                await this.adapter.updateById(survey_id, {
                    $set: {
                        deletedAt: new Date()
                    }
                });
            }
        },
        createTemplate: {
            async handler(ctx) {
                const {survey_id} = ctx.params
                const questions = await ctx.call("question.getBySurveyId", {survey_id})
                const survey = await this.adapter.findById(survey_id)
                const newSurvey = await ctx.call("survey.create", {title: survey.title})
                const newSurveyId = newSurvey._id
                for (let question of questions) {
                    let {text} = question
                    await ctx.call('question.create', {survey_id: String(newSurveyId), text})
                }
                return newSurvey

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
