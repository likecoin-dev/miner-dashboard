'use strict';

var _ = require('lodash'),
    request = require('request'),

    Module = require('../../Module'),
    intervalTime,
    interval;

module.exports = Module.extend({
    defaults: {
        interval: 60 * 60 * 1e3,
        symbol: 'mtgoxUSD'
    },

    template: 'market',

    initialize: function () {
        var self = this;

        self.title = self.config.symbol + ' Market @ Bitcoin Charts';

        if (interval && self.config.interval < intervalTime) {
            clearInterval(interval);
        }
        if (!interval) {
            intervalTime = self.config.interval;
            interval = setInterval(function () {
                self.updateMarketStats();
            }, self.config.interval);
        }
        self.updateMarketStats();
    },

    updateMarketStats: function () {
        var self = this;

        request({
            uri:  'http://api.bitcoincharts.com/v1/markets.json',
            json: true
        }, function (err, res) {
            var market = res.body.filter(function (market) {
                return market.symbol === self.config.symbol;
            })[0];

            self.updateData(market);
        });
    },

    renderView: function () {
        return this.template(_.extend({
            id: this.id,
            title: this.title
        }, this.data, {
            bid: this.data.bid.toFixed(6),
            ask: this.data.ask.toFixed(6),
            close: this.data.close.toFixed(6)
        }));
    }
});