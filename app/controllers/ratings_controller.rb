class RatingsController < ApplicationController
  def top
    @top_sneks = Snek.all.map { |snek| {snek: snek, score: SnekScore.new(snek).score, battles: snek.snek_battles.count, change: 0, position: 0 } }.sort { |a,b| a[:score] <=> b[:score]  }.reverse.delete_if { |s| s[:score] == 0 }.take(100)
    @top_sneks.each_with_index do |snek, index|
      @top_sneks[index][:position] = index + 1
      prev_day_position = 0
      daily_rating = snek[:snek].daily_ratings.order(id: :desc).first
      if daily_rating
        prev_day_position = daily_rating.position
      end
      @top_sneks[index][:change] = -(@top_sneks[index][:position] - prev_day_position)
    end
  end

  def national
    countries = {}
    Snek.all.each do |snek|
      if snek.country
        score = SnekScore.new(snek).score
        if score > 0
          unless countries.key?(snek.country)
            countries[snek.country] = 0
          end
          countries[snek.country] += score
        end
      end
    end
    @rating = countries.to_a.sort { |a,b| a[1] <=> b[1] }.reverse
  end

end
