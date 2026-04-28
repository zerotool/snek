class NotifyMailer < ApplicationMailer

  def stripe
    mail to: SnekConfig.env_or_credential('NOTIFICATION_EMAIL', :notification_email),
         subject: 'Stripe Event',
         body: params[:event],
         content_type: 'text/plain'
  end

end
