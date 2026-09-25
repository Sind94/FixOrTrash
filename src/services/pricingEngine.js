/**
 * FixOrTrash Pro — Pricing & Financial Calculation Engine
 * Unified pricing, smart continuous markup curve, psychological rounding,
 * cash change calculations and fiscal helpers.
 */

// Anchor points for continuous markup interpolation
const MARKUP_ANCHORS = [
    { cost: 0.5, markup: 450 },
    { cost: 1.0, markup: 400 },
    { cost: 2.5, markup: 260 },
    { cost: 5.0, markup: 160 },
    { cost: 8.0, markup: 125 },
    { cost: 10.0, markup: 110 },
    { cost: 15.0, markup: 90 },
    { cost: 25.0, markup: 70 },
    { cost: 50.0, markup: 50 },
    { cost: 80.0, markup: 38 },
    { cost: 150.0, markup: 26 },
    { cost: 250.0, markup: 20 },
    { cost: 500.0, markup: 15 },
    { cost: 1000.0, markup: 12 }
];

export const pricingEngine = {
    /**
     * Calculates the smart recommended markup percentage based on wholesale purchase cost
     * using continuous sliding scale interpolation (no cliff-edge paradoxes).
     * @param {number|string} costInput - Purchase cost in euros
     * @param {boolean} roundToEuro - Whether to round selling price to the nearest integer euro
     * @returns {Object} { cost, recommendedMarkup, rawPrice, sellingPrice, netProfit }
     */
    getRecommendedMarkup(costInput, roundToEuro = true) {
        const cost = parseFloat(costInput) || 0;
        if (cost <= 0) {
            return {
                cost: 0,
                recommendedMarkup: 50,
                rawPrice: 0,
                sellingPrice: 0,
                netProfit: 0
            };
        }

        let interpMarkup = 50;

        if (cost <= MARKUP_ANCHORS[0].cost) {
            interpMarkup = MARKUP_ANCHORS[0].markup;
        } else if (cost >= MARKUP_ANCHORS[MARKUP_ANCHORS.length - 1].cost) {
            interpMarkup = MARKUP_ANCHORS[MARKUP_ANCHORS.length - 1].markup;
        } else {
            for (let i = 0; i < MARKUP_ANCHORS.length - 1; i++) {
                const a1 = MARKUP_ANCHORS[i];
                const a2 = MARKUP_ANCHORS[i + 1];
                if (cost >= a1.cost && cost <= a2.cost) {
                    const t = (cost - a1.cost) / (a2.cost - a1.cost);
                    interpMarkup = a1.markup + t * (a2.markup - a1.markup);
                    break;
                }
            }
        }

        const rawPrice = cost * (1 + interpMarkup / 100);
        
        // Round to nearest euro: < .50 rounds down, >= .50 rounds up
        let sellingPrice = roundToEuro ? Math.round(rawPrice) : parseFloat(rawPrice.toFixed(2));
        
        // Ensure selling price is never strictly less than cost
        if (sellingPrice < cost) {
            sellingPrice = Math.ceil(cost);
        }

        const netProfit = parseFloat((sellingPrice - cost).toFixed(2));
        const effectiveMarkup = cost > 0 ? Math.round(((sellingPrice - cost) / cost) * 100) : Math.round(interpMarkup);

        return {
            cost,
            recommendedMarkup: effectiveMarkup,
            rawPrice: parseFloat(rawPrice.toFixed(2)),
            sellingPrice,
            netProfit
        };
    },

    /**
     * Mathematical rounding to nearest integer euro:
     * < .50 rounds down (difetto), >= .50 rounds up (eccesso).
     * e.g., 20.40 -> 20, 20.60 -> 21, 20.50 -> 21.
     */
    roundToEuro(val) {
        const num = parseFloat(val) || 0;
        return Math.round(num);
    },

    /**
     * Calculate selling price from cost and custom markup %
     */
    calculatePriceFromMarkup(costInput, markupInput, roundToEuro = true) {
        const cost = parseFloat(costInput) || 0;
        const markup = parseFloat(markupInput) || 0;
        const raw = cost * (1 + markup / 100);
        const sellingPrice = roundToEuro ? Math.round(raw) : parseFloat(raw.toFixed(2));
        const netProfit = parseFloat((sellingPrice - cost).toFixed(2));
        return {
            cost,
            markup,
            sellingPrice,
            netProfit
        };
    },

    /**
     * Reverse calculate markup % from cost and desired selling price
     */
    calculateMarkupFromPrice(costInput, priceInput) {
        const cost = parseFloat(costInput) || 0;
        const sellingPrice = parseFloat(priceInput) || 0;
        if (cost <= 0) {
            return { cost: 0, sellingPrice, markup: 0, netProfit: sellingPrice };
        }
        const netProfit = parseFloat((sellingPrice - cost).toFixed(2));
        const markup = Math.round(((sellingPrice - cost) / cost) * 100);
        return {
            cost,
            sellingPrice,
            markup,
            netProfit
        };
    },

    /**
     * Cash change calculation helper
     * @param {number} totalDue - Amount to pay
     * @param {number} cashReceived - Money handed by customer
     */
    calculateCashChange(totalDue, cashReceived) {
        const due = parseFloat(totalDue) || 0;
        const received = parseFloat(cashReceived) || 0;
        const change = Math.max(0, received - due);
        const missing = Math.max(0, due - received);
        const isSufficient = received >= due;

        return {
            due: parseFloat(due.toFixed(2)),
            received: parseFloat(received.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            missing: parseFloat(missing.toFixed(2)),
            isSufficient
        };
    },

    /**
     * Standard bill denominations for fast touch selection at counter
     */
    BILL_DENOMINATIONS: [5, 10, 20, 50, 100]
};
