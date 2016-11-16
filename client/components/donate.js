'use strict';
import _ from'lodash';
import moment from 'moment';
import $ from 'jquery';
import gaEvents from '../ga_events';
import gaEcommerce from '../ga_ecommerce';
import validateStripe from '../stripe/validation.js';

function addStylesToNodes(parent) {
  let nodes = parent.querySelectorAll('.donate_landing__section');
  console.log('nodes', nodes);
  
  let count = 100 / nodes.length;
  console.log('count', count);
  if(nodes.length) {
    Array.prototype.slice.call(nodes).forEach(node => {
      console.log('node', node, count);
      node.style.width = count + '%';
      node.style.float = 'left';
    });
  }
}

function setViewportWidth(parent) {
  let form = parent;
  let nodes = form.querySelectorAll('.donate_landing__section');
  let viewport = form.querySelector('.donate_landing__viewport');
  let width = form.offsetWidth;

  // viewport.style.width = `${num * width}px`;
  viewport.style.width = `300%`;
}

function configForm(parent) {
  addStylesToNodes(parent);
  setViewportWidth(parent);
}


let componentData = {
  donation_type: 'monthly',
  errors: null,
  success: false,
  loading: false,
  stripe: {
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    token: ''
  },

  contact: {
    name: null,
    email: null,
    country: null,
    stripe_token: null
  },

  card: {
    Visa: false,
    MasterCard: false,
    DinersClub: false,
    AmericanExpress: false,
    Discover: false
  },

  captcha: null,
  created_at: moment().format(),
  amount: 30,
  section: 1
};

export default () => ({
  template: "#donate-landing-template",

  props: [
    'captcha_name',
    'url',
    'currency'
  ],

  data() {
    return $.extend(true, {}, componentData);
  },

  ready() {
    configForm(this.$el);
    console.log('donate component', );
  },

  computed: {
    cardType() {
      let type = Stripe.card.cardType(this.stripe.number).replace(" ", "");
      return type;
    }
  },

  events: {
    'focus-amount': function () {
      this.amount = 1;
      this.$els.amountInput.focus();
    }
  },

  methods: {
    showCard() {
      Object.keys(this.card).map(key => {
        if(key === this.cardType) {
          return this.card[key] = true;
        } else {
          return this.card[key] = false;
        }
      });
    },

    cleanNumber(keypath) {
      let val = this.$get(keypath);
      this.$set(keypath, val.replace(/[^0-9]+/, ''));
    },

    maxLength(keypath, length) {
      let val = this.$get(keypath);
      this.$set(keypath, val.substring(0, length));
    },

    isRequired(keypath) {
      let error = {};
      let val = this.$get(keypath) ? this.$get(keypath) : '';

      if(val === "") {
         error[keypath] = true;
      } else {
        error[keypath] = false;
      }

      return error;
    },

    createToken() {
      let stripeData = {
        number: this.stripe.number,
        cvc: this.stripe.cvc,
        exp_month: this.stripe.exp_month,
        exp_year: this.stripe.exp_year
      };

      this.toggleLoading();

      //send wp_ajax to get token
      let data = {action: 'stripe_token', data: stripeData};

      $.ajax({
        type: 'post',
        url: '/wp-admin/admin-ajax.php',
        data: data
      })
      .done(res => this.handleToken(res));

    },

    handleToken(response) {
      this.toggleLoading();

      if(response.id) {
        this.stripe.token = response.id;
        this.nextSection();
      }

      if(response.error) {
        this.errors = {stripe: response.error.message};
      }
    },

    contactValidations() {
      let fields = [
        'contact.name',
        'contact.email',
        'contact.country'
      ];

      let errors = {};

      fields.forEach((key) => {
        errors = _.extend(errors, this.isRequired(key));
      });

      this.errors = errors;

    },

    showErrors() {
      let errorAmount = this.isRequired('amount');
      this.errors = _.extend(validateStripe(this.stripe).errors, errorAmount);
    },

    removeErrors() {
      this.errors = null;
    },

    toggleLoading() {
      this.loading = !this.loading;
    },

    cleanData() {
      this.stripe = _.extend(this.stripe, componentData.stripe);
      this.contact = _.extend(this.contact, componentData.contact);

    },

    getToken(e) {
      e.preventDefault();

      if(validateStripe(this.stripe).success) {
        this.removeErrors();
        this.createToken();
      } else {
        this.showErrors();
      }
    },

    onSubmit(e) {
      e.preventDefault();

      this.contactValidations();

      const {contact, currency, amount, donation_type, stripe_token} = this;

      let data = {
        ...contact,
        currency,
        amount,
        donation_type,
        stripe_token,
      };

      this.toggleLoading();

      $.ajax({
        url: '/wp-admin/admin-ajax.php',
        type: 'post',
        data: {action: 'stripe_charge', data: data},
        beforeSend: () => {
          this.removeErrors();
        }
      })
      .then(res => {
        if(res.id) this.success = true;
        console.log('complete');
      });

    },

    changeType(type, evt) {
      evt.preventDefault();
      this.donation_type = type;
    },

    sendEccomerceData(response) {
      if(this.donation_type == 'monthly') {
        gaEvents.donateMonthly();
        if(gaEcommerce) gaEcommerce(response.stripe.id, null, this.amount);
        if(fbq) fbq('track', 'Purchase', {value: this.amount, currency: 'EUR'});

      }

      if(this.donation_type == 'once') {
        gaEvents.donateUnique();
        if(gaEcommerce) gaEcommerce(response.stripe.id, null, this.amount);
        if(fbq) fbq('track', 'Purchase', {value: this.amount, currency: 'EUR'});
      }
    },

    handleSubmitResponse(res) {
      let response = {};

      try {
        response = JSON.parse(res);
      } catch (e) {
        this.removeErrors();
        console.log('donate response err: ', res);
      }

      this.toggleLoading();

      if(response.success) {
        this.removeErrors();
        this.success = true;
        this.sendEccomerceData(response);

        let subdata = `?customer_id=${response.stripe.customer}&order_revenue=${this.amount}&order_id=${response.stripe.id}&landing_thanks=true&landing_revenue=${this.amount}`;

        window.location = '/landing-thanks/' + subdata;

      } else if(response.errors) {
        this.errors = response.errors;
      }
    },

     nextSection() {
      let parent = this.$el;
      let nodes = parent.querySelectorAll('.donate_landing__section');

      let section = this.section;
      let nodeSection = parent.querySelector(`.donate_landing__section-${section + 1}`);
      let height = nodeSection.offsetHeight;
      let form = parent;

      let viewport = document.querySelector('.donate_landing__viewport');
      let width = form.offsetWidth;
      let next = section * 100;

      viewport.style.left = `-${next}%`;
      this.section = section + 1;
    },

    backSection() {
      let parent = this.$el;
      let section = this.section;
      let nodeSection = parent.querySelector(`.donate_landing__section-${section - 1}`);
      let height =  nodeSection.offsetHeight;
      let form = parent;

      let viewport = parent.querySelector('.donate_landing__viewport');
      let width = form.offsetWidth;
      let actual = width * (section - 1);
      let prev = actual - width;
        viewport.style.left = `-${prev}px`;
      this.section = section - 1;
    }
  }
});
