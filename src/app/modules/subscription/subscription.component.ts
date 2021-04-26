import { Component, OnInit } from '@angular/core';

declare var Chargebee: any;

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

   Basic() {
    // see https://www.chargebee.com/checkout-portal-docs/drop-in-tutorial.html#simulating-drop-in-script-functionality-with-your-button
     let cbInstance = Chargebee.getInstance();
    let cart = cbInstance.getCart();
    let product = cbInstance.initializeProduct("basic-plan");
    cart.replaceProduct(product);
    cart.proceedToCheckout();
  }
 

Core() {
    // see https://www.chargebee.com/checkout-portal-docs/drop-in-tutorial.html#simulating-drop-in-script-functionality-with-your-button
     let cbInstance = Chargebee.getInstance();
    let cart = cbInstance.getCart();
    let product = cbInstance.initializeProduct("test_demo");
    cart.replaceProduct(product);
    cart.proceedToCheckout();
  }

Premium() {
    // see https://www.chargebee.com/checkout-portal-docs/drop-in-tutorial.html#simulating-drop-in-script-functionality-with-your-button
     let cbInstance = Chargebee.getInstance();
    let cart = cbInstance.getCart();
    let product = cbInstance.initializeProduct("premium-plan");
    cart.replaceProduct(product);
    cart.proceedToCheckout();
  }
}
