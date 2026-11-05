-- Demo data. Create these four users first (Authentication -> Users -> Add user, "Auto Confirm"):
--   manager@mini-crm.test, manager2@mini-crm.test, ivanov@mini-crm.test, petrov@mini-crm.test
-- Then run this file once in the SQL editor. Dates are relative to the moment it runs.

do $$
declare
  v_manager uuid := (select id from auth.users where email = 'manager@mini-crm.test');
  v_manager2 uuid := (select id from auth.users where email = 'manager2@mini-crm.test');
  v_ivanov uuid := (select id from auth.users where email = 'ivanov@mini-crm.test');
  v_petrov uuid := (select id from auth.users where email = 'petrov@mini-crm.test');
  v_park uuid;
  v_school uuid;
  v_warehouse uuid;
  v_task uuid;
begin
  if v_manager is null or v_manager2 is null or v_ivanov is null or v_petrov is null then
    raise exception 'Create the four test users in Supabase Auth before running the seed';
  end if;

  insert into public.profiles (id, full_name, role) values
    (v_manager, 'Анна Соколова', 'manager'),
    (v_manager2, 'Олег Беляев', 'manager'),
    (v_ivanov, 'Иван Иванов', 'executor'),
    (v_petrov, 'Пётр Петров', 'executor');

  insert into public.objects (name, address, created_by, created_at)
  values ('ЖК «Северный парк», корпус 2', 'г. Новосибирск, ул. Сибирская, 15', v_manager, now() - interval '20 days')
  returning id into v_park;

  insert into public.objects (name, address, created_by, created_at)
  values ('Школа на 550 мест', 'г. Бердск, ул. Лесная, 7', v_manager, now() - interval '14 days')
  returning id into v_school;

  insert into public.objects (name, address, created_by, created_at)
  values ('Складской комплекс «Восток»', 'г. Новосибирск, Толмачёвское шоссе, 42', v_manager2, now() - interval '9 days')
  returning id into v_warehouse;

  -- The insert trigger writes the "created" history row from created_at and author_id.
  -- Further rows below mirror how the task reached its current status.

  -- Новая
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status, created_at)
  values ('Проверить акт скрытых работ по фундаменту',
    'Сверить акт с проектной документацией, подписать у технадзора.',
    v_park, v_ivanov, v_manager, 'new', now() - interval '1 day');

  insert into public.tasks (title, description, object_id, assignee_id, author_id, status, created_at)
  values ('Заказать арматуру на третий этап',
    'Объём по спецификации КЖ-3, доставка на следующей неделе.',
    v_school, v_petrov, v_manager2, 'new', now() - interval '6 hours');

  -- В работе
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status, created_at)
  values ('Смонтировать опалубку перекрытия 4 этажа',
    'Секции А и Б. Перед заливкой сфотографировать армирование.',
    v_park, v_petrov, v_manager, 'in_progress', now() - interval '5 days')
  returning id into v_task;
  insert into public.task_status_history (task_id, from_status, to_status, changed_by, changed_at)
  values (v_task, 'new', 'in_progress', v_petrov, now() - interval '4 days');

  -- На проверке
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status, created_at)
  values ('Устранить замечания по кровле',
    'Замечания из акта от технадзора, пункты 3 и 7.',
    v_school, v_ivanov, v_manager, 'in_review', now() - interval '7 days')
  returning id into v_task;
  insert into public.task_status_history (task_id, from_status, to_status, changed_by, changed_at) values
    (v_task, 'new', 'in_progress', v_ivanov, now() - interval '6 days'),
    (v_task, 'in_progress', 'in_review', v_ivanov, now() - interval '3 hours');

  -- На доработке
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status, created_at)
  values ('Подготовить исполнительную схему фасада',
    'Схема по осям 1-8, согласовать с геодезистом.',
    v_park, v_ivanov, v_manager2, 'rework', now() - interval '8 days')
  returning id into v_task;
  insert into public.task_status_history (task_id, from_status, to_status, changed_by, comment, changed_at) values
    (v_task, 'new', 'in_progress', v_ivanov, null, now() - interval '7 days'),
    (v_task, 'in_progress', 'in_review', v_ivanov, null, now() - interval '2 days'),
    (v_task, 'in_review', 'rework', v_manager2, 'На схеме нет отметок по оси 5. Добавьте и отправьте снова.', now() - interval '1 day');

  -- Принята
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status, created_at)
  values ('Огородить площадку и установить знаки',
    'Ограждение по периметру, информационный щит у въезда.',
    v_warehouse, v_petrov, v_manager2, 'accepted', now() - interval '9 days')
  returning id into v_task;
  insert into public.task_status_history (task_id, from_status, to_status, changed_by, changed_at) values
    (v_task, 'new', 'in_progress', v_petrov, now() - interval '8 days'),
    (v_task, 'in_progress', 'in_review', v_petrov, now() - interval '6 days'),
    (v_task, 'in_review', 'accepted', v_manager2, now() - interval '5 days');
end;
$$;
