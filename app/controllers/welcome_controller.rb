class WelcomeController < ApplicationController

  def index
    @with_hero_unit = true
    @top_sneks = Snek.all.map { |snek| {snek: snek, score: SnekScore.new(snek).score, battles: snek.snek_battles.count } }.sort { |a,b| a[:score] <=> b[:score]  }.reverse.delete_if { |s| s[:score] == 0 }.take(10)
    ahoy.track('HomePage')
  end

  def long
  end

  def rules
    ahoy.track('Rules')
    render "welcome/rules.#{I18n.locale}.slim"
  end

  def credits

  end

end
