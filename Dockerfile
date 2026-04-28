FROM ruby:2.7.5-bullseye

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      imagemagick \
      libmagickwand-dev \
      libpq-dev \
      nodejs \
      pkg-config \
      postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN gem install bundler -v 2.0.1 --no-document

COPY Gemfile Gemfile.lock ./
RUN bundle _2.0.1_ install

COPY . .

RUN chmod +x bin/docker-entrypoint bin/docker-web bin/docker-sidekiq

ENTRYPOINT ["bin/docker-entrypoint"]
