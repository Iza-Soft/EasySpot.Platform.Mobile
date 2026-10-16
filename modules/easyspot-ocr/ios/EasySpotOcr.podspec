Pod::Spec.new do |s|
  s.name           = 'EasySpotOcr'
  s.version        = '1.0.0'
  s.summary        = 'On-device text recognition with Apple Vision (EasySpot)'
  s.description    = 'Pillar Scan and Ticket Scan: text in a photo, offline.'
  s.author         = 'Ilko Adamov'
  s.homepage       = 'https://github.com/iza-soft'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = "**/*.{h,m,swift}"
end
