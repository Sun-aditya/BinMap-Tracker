insert into public.dustbins (
  name,
  description,
  latitude,
  longitude,
  operational_status,
  moderation_status
)
values
  ('Sector 17 Plaza Dustbin', 'Near the pedestrian plaza entrance.', 30.7402, 76.7821, 'available', 'approved'),
  ('Rose Garden Gate Bin', 'Outside the main garden gate.', 30.7461, 76.7820, 'full', 'approved'),
  ('Sector 22 Market Bin', 'Beside the public parking lane.', 30.7290, 76.7725, 'available', 'approved'),
  ('Sukhna Lake Walkway Bin', 'Reported damaged near the walkway.', 30.7426, 76.8188, 'damaged', 'approved'),
  ('Sector 35 Bus Stop Bin', 'Near the bus stop and public footpath.', 30.7228, 76.7613, 'available', 'approved');
