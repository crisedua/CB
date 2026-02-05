# Complete Field Extraction Checklist

Based on the actual forms, here are ALL fields that need to be extracted:

## Header Section
- [ ] Acto (Act number, e.g., "10-4-1")
- [ ] N° de Incendio (Incident number)
- [ ] Lista N° (List number, e.g., "040-2026")
- [ ] Fecha (Date DD/MM/YYYY)
- [ ] Hora del Acto (Time HH:MM)
- [ ] Llegada al Lugar (Arrival time)
- [ ] Retirada (Withdrawal time)
- [ ] Hora de Regreso (Return time)

## Command Section
- [ ] A Cargo del Cuerpo (Commander name)
- [ ] A Cargo de la Compañía (Company commander name)

## Location Section
- [ ] Dirección Exacta (Exact address)
- [ ] N° (Street number)
- [ ] Depto. (Apartment)
- [ ] Piso (Floor)
- [ ] Esquina (más próx.) (Corner/cross street)
- [ ] Población (Population/neighborhood)
- [ ] Comuna (Commune)

## Incident Details
- [ ] Naturaleza del lugar (Nature of location)
- [ ] Lugar del fuego o Rescate (Fire/rescue location)
- [ ] Origen (Origin - detailed description)
- [ ] Causa (Cause - detailed description)

## Vehicles Table (Extract ALL rows)
- [ ] Marca (Brand)
- [ ] Modelo (Model)
- [ ] Patente (License plate)
- [ ] Nombre Conductor (Driver name)
- [ ] RUN (Driver ID)

## Insurance Section
- [ ] Seguro: SI/NO (Has insurance checkbox)
- [ ] Compañía de Seguros (Insurance company name)
- [ ] Móviles Asistentes: R-5, RX-2, RCS (Mobile units checkboxes)
- [ ] Conductor(es) (Conductors names)
- [ ] Otras Cías (Other companies text)

## Company Attendance Grid
- [ ] 5ª (Quinta company number)
- [ ] 1ª (Primera company number)
- [ ] 2ª (Segunda company number)
- [ ] 3ª (Tercera company number)
- [ ] 4ª (Cuarta company number)
- [ ] 6ª (Sexta company number)
- [ ] 7ª (Septima company number)
- [ ] 8ª (Octava company number)
- [ ] BC/BP (BC/BP number)
- [ ] Asistencia (Attendance)
- [ ] Corrección (Correction)

## Sector Attendance
- [ ] Rural checkbox
- [ ] Lugar (Location)
- [ ] Sector numbers 1-6 (checkboxes)

## People Counts
- [ ] Cant. Lesionados (Number of injured)
- [ ] Cant. Involucrados (Number involved)
- [ ] Cant. Damnificados (Number affected)
- [ ] Cant. 7-3 (7-3 count)

## Involved People Table (Extract ALL rows)
- [ ] Nombre Completo (Full name)
- [ ] RUN (ID number)
- [ ] Atendido por 132: SI/NO (Attended by 132 checkbox)
- [ ] Observación (Observation: "Trasladado por 1-2", "Rechaza traslado", etc.)

## Observations
- [ ] Observaciones (Main observations - full text)
- [ ] Otras Observaciones (Other observations - full text)

## Institutions Present (Bottom section)
- [ ] En el lugar: PDI, Prensa, Bernagred, Saesa, Suralic, ONG (checkboxes)
- [ ] Otros (Other institutions)

### Carabineros Section
- [ ] Nombre Completo (Full name)
- [ ] Grado (Grade/rank)
- [ ] Comisaría (Police station)
- [ ] Móvil (Mobile unit number)

### Ambulancia Section
- [ ] Nombre Completo (Full name)
- [ ] Cargo (Position)
- [ ] Entidad (Entity/organization)
- [ ] Móvil (Mobile unit number)

## Report Metadata
- [ ] Informe elaborado por: Incendio (Report prepared by)
- [ ] Llamado de Comandancia (Command call)
- [ ] Lista confeccionada por (List prepared by - name)
- [ ] Oficial O Bombero a Cargo (Officer/firefighter in charge - name and signature)

## Database Schema Needed

### incidents table additions:
- incident_number, list_number
- arrival_time, withdrawal_time, return_time
- company_number, department, floor
- fire_rescue_location, damage
- insurance_company, has_insurance, mobile_units[], insurance_conductors
- company_quinta through company_octava, company_bc_bp
- attendance_correction, sector_rural, sector_location, sector_numbers[]
- cant_lesionados, cant_involucrados, cant_damnificados, cant_7_3
- report_prepared_by, list_prepared_by, officer_in_charge, called_by_command

### incident_institutions table (NEW):
- institution_type, present, name, grade, comisaria, movil, cargo, entidad
