if Rails.env.production?
  stripe_private_key = SnekConfig.env_or_credential('STRIPE_PRIVATE_KEY', :stripe, :private)
  Stripe.api_key = stripe_private_key if stripe_private_key.present?
end
