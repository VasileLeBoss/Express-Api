INSERT INTO public.config(key, value) VALUES
  ('app.name', '{"service":"dernier-metro-api"}'),
  ('metro.defaults', '{"line":"M1","headwayMin":3,"tz":"Europe/Paris"}'),
  ('metro.last', '{"Chatelet":"01:25","Gare de Lyon":"01:30","Bastille":"01:28"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
