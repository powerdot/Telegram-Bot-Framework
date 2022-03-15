module.exports = (bot) => {
    let express = require("express");
    let router = express.Router();
    let config = require("../../../config");
    let keyboard_builder = require("../../../lib/helpers/keyboard_builder");
    let moment = require("moment");
    let users = require('../../../lib/helpers/users');
    let db = require('../../../lib/helpers/db');

    router.all("/", (req, res) => {
        return res.send("api hi!")
    });

    router.use(async (req, res, next) => {
        let data_holder = Object.keys(req.body).length != 0 ? req.body : req.query;
        if (!data_holder.token_id) return res.status(403).send("no token_id");
        let data = await getTokenizedData(data_holder.token_id);
        if (!data) return res.status(403).send("wrong token_id");
        if (!req.body) req.body = {};
        req.body.TokenizedData = data;
        // console.log(data);
        return next();
    })

    router.get("/stats", async (req, res) => {
        // let data = {
        //     cardsStats: undefined,
        //     clients: {
        //         count: undefined,
        //         count_male: undefined,
        //         birthday: {}
        //     },
        //     cards: {},
        //     statistics: {
        //         pushes: {}
        //     }
        // };

        // data.cardsStats = (await seq.sequelize.query(`select count(*) as amount, DATE(createdAt) date from cards where shop_id=${req.body.TokenizedData.shop_id} and DATE(createdAt) > "${moment().add(-14,'days').format("YYYY-MM-DD")}" group by DATE(createdAt)`))[0];
        // for(let d of data.cardsStats){
        //     d.date_human = moment(d.date, 'YYYY-MM-DD').locale('ru').format("DD MMM");
        // }
        // console.log(data);


        // data.clients.count = await seq.ClientsData.count({
        //     where: {
        //         [seq.Op.and]: [{
        //                 shop_id: req.body.TokenizedData.shop_id
        //             },
        //             {
        //                 createdAt: {
        //                     [seq.Op.gt]: moment().add(-31, 'days').toDate()
        //                 }
        //             }
        //         ]
        //     }
        // });

        // data.clients.count_male = await seq.ClientsData.count({
        //     where: {
        //         [seq.Op.and]: [{
        //                 shop_id: req.body.TokenizedData.shop_id
        //             },
        //             {
        //                 createdAt: {
        //                     [seq.Op.gt]: moment().add(-31, 'days').toDate()
        //                 }
        //             },
        //             {
        //                 gender: 1
        //             }
        //         ]
        //     },
        //     logging: true
        // });



        // data.cards.count = await seq.Cards.count({
        //     where: {
        //         shop_id: req.body.TokenizedData.shop_id
        //     }
        // });
        // data.cards.ios = await seq.Cards.count({
        //     where: {
        //         [seq.Op.and]: [{
        //                 shop_id: req.body.TokenizedData.shop_id
        //             },
        //             {
        //                 type: "ApplePass"
        //             }
        //         ]
        //     }
        // });

        // data.statistics.pushes.sent = await seq.Statistics.count({
        //     where: {
        //         [seq.Op.and]: [{
        //                 shop_id: req.body.TokenizedData.shop_id
        //             },
        //             {
        //                 createdAt: {
        //                     [seq.Op.gt]: moment().add(-31, 'days').toDate()
        //                 }
        //             },
        //             {
        //                 type: "push"
        //             }
        //         ]
        //     }
        // });

        // // data.statistics.pushes.download = (await seq.sequelize.query(`select count(*), DATE(createdAt), HOUR(createdAt), MINUTE(createdAt), shop_card_number from statistics where shop_id=${req.body.TokenizedData.shop_id} and DATE(createdAt) > "${moment().add(-14,'days').format("YYYY-MM-DD")}" group by DATE(createdAt), HOUR(createdAt), MINUTE(createdAt), shop_card_number`))[0].length;



        // let birthdays_avg = [];
        // let birthdays_avg_sum = 0;
        // let birthdays = await seq.ClientsData.findAll({
        //     where: {
        //         shop_id: req.body.TokenizedData.shop_id
        //     }
        // });
        // for (let b of birthdays) {
        //     let b1 = moment().diff(moment(b.birthday + " 00:00:00"), 'years');
        //     if (isNaN(b1)) continue;
        //     if (b1 == NaN) continue;
        //     if (b1 == null) continue;
        //     if (b1 < 16) continue;
        //     birthdays_avg.push(b1);
        //     birthdays_avg_sum += parseInt(b1);

        // }
        // let birthday_avg = parseInt(birthdays_avg_sum / birthdays_avg.length);
        // data.clients.birthday = {
        //     birthday_avg
        // }


        return res.send({});
    });


    async function getTokenizedData(token_id) {
        return await db.webService.secureTokens.getData(token_id);
    }

    return router;
}