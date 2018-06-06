class PaidSubscriptionsController < ApplicationController
  before_action :authenticate_user!
  def create

    if current_user.stripe_id.nil?
      redirect_to billing_path, alert: 'Add your bank card, please'
      return
    end

    product = params[:product]
    product_price = PaidSubscription.product_price(product)

    case product
    when 'pro_snek'
      product_code = Rails.application.credentials.stripe[:product_pro_snek]
      redirect_path = new_snek_path
    else
      raise Exception, "Product type #{product} is not supported"
    end

    # Create stripe subscription
    plan_id = Stripe::Plan.list(product: product_code).first['id']
    stripe_subscription = Stripe::Subscription.create customer: current_user.stripe_id,
                                                      items: [
                                                        { plan: plan_id }
                                                      ]
    Stripe::Plan
    # Create our local subscription
    current_user.paid_subscriptions.create! product: product,
                                            amount: product_price,
                                            paid_till: 1.month.from_now,
                                            stripe_id: stripe_subscription.id

    redirect_to redirect_path

  end
end