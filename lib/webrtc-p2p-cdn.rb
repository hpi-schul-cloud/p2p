require "webrtc-p2p-cdn/version"

module WebrtcP2pCdn
  module Rails
    class Engine < ::Rails::Engine

      initializer "static assets" do |app|
        app.middleware.insert_after(::Rack::Runtime, ::ActionDispatch::Static, "#{root}/public")
      end
    end
  end
end
