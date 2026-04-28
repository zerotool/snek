module SnekConfig
  module_function

  def env_or_credential(env_key, *credential_path, default: nil)
    env_value = ENV[env_key]
    return env_value if env_value.present?

    credential(*credential_path, default: default)
  end

  def credential(*path, default: nil)
    creds = safe_credentials
    value = creds.dig(*path)
    value.nil? ? default : value
  rescue NoMethodError,
         ArgumentError,
         ActiveSupport::EncryptedFile::MissingKeyError,
         ActiveSupport::MessageEncryptor::InvalidMessage,
         OpenSSL::Cipher::CipherError
    default
  end

  def safe_credentials
    return @safe_credentials if defined?(@safe_credentials)

    @safe_credentials = Rails.application.credentials
  rescue ActiveSupport::EncryptedFile::MissingKeyError,
         ActiveSupport::MessageEncryptor::InvalidMessage,
         OpenSSL::Cipher::CipherError
    @safe_credentials = {}
  end
end
