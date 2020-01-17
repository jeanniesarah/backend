"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { MoleculerClientError } = require("moleculer").Errors;
const  _ = require('lodash')

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
                console.log('get buy id')
                const {survey_id} = ctx.params;
                const survey = await this.getById(survey_id);
                const questions = await ctx.call('question.getBySurveyId', {survey_id});
                const user = await ctx.call('user.getPro', {user_id: survey.userId})
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
        surveyOwner: {
            async handler(ctx) {
                const {survey_id} = ctx.params;
                const survey = await this.getById(survey_id);
                const user = await ctx.call('user.getById', {user_id: survey.userId})
                return _.pick(user, ['_id', "email", "isPro"])
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
                title: "string",
                footerHTML: {
                    type: "string",
                    optional: true
                },
                textQuestionLabel: {
                    type: "string",
                    optional: true
                },
                textQuestionPlaceholder: {
                    type: "string",
                    optional: true
                }
            },
            async handler(ctx) {
                const {title, footerHTML, textQuestionLabel, textQuestionPlaceholder} = ctx.params;
                const new_survey = await this.adapter.insert({
                    title,
                    footerHTML, 
                    textQuestionLabel, 
                    textQuestionPlaceholder,
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
                const {survey_id, title, footerHTML, textQuestionLabel, textQuestionPlaceholder} = ctx.params;
                await ctx.call("survey.checkSurveyAccess", {survey_id});
                await this.adapter.updateById(survey_id, {
                    $set: {
                        title, footerHTML, textQuestionLabel, textQuestionPlaceholder
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
