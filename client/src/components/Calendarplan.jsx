import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChromePicker } from 'react-color';
import styled from 'styled-components';

// Initialize moment localizer
const localizer = momentLocalizer(moment);

// Custom hook to persist state to localStorage
const UsePersistedState = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const ContentWrapper = styled.div`
  display: flex;
`;

const Sidebar = styled.div`
  width: 300px;
  padding: 20px;
  border-right: 1px solid #ddd;
`;

const PickerWrapper = styled.div`
  margin-bottom: 20px;
`;

const EventCreation = styled.div`
  display: flex;
  flex-direction: column;
`;

const EventInput = styled.input`
  margin-bottom: 10px;
  padding: 5px;
  font-size: 14px;
`;

const AddButton = styled.button`
  padding: 5px;
  background-color: #3174ad;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
`;

const CalendarContainer = styled.div`
  flex-grow: 1;
  padding: 20px;
`;

const AgendaWrapper = styled.div`
  .rbc-agenda-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  .rbc-agenda-table thead {
    background-color: #f1f1f1;
  }

  .rbc-agenda-table th,
  .rbc-agenda-table td {
    padding: 10px;
    border: 1px solid #ddd;
  }

  .rbc-agenda-table th {
    font-weight: bold;
    text-align: left;
  }

  .rbc-agenda-table td {
    background-color: #fff;
  }

  .rbc-agenda-event-cell {
    display: flex;
    flex-direction: column;
  }

  .rbc-agenda-event {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }
`;

function CalendarPlan() {
  const [events, setEvents] = UsePersistedState('events', []);
  const [color, setColor] = useState('#3174ad'); // Default color for new events

  const handleSelectSlot = ({ start, end }) => {
    const title = prompt('New Event Name');
    if (title) {
      const newEvent = {
        id: Date.now().toString(), // convert to string to avoid numeric IDs
        start,
        end,
        title,
        color
      };
      setEvents(prevEvents => [...prevEvents, newEvent]);
    }
  };

  const handleSelectEvent = (event) => {
    if (window.confirm(`Do you want to delete the event '${event.title}'`)) {
      setEvents(prevEvents => prevEvents.filter((e) => e.id !== event.id));
    }
  };

  const moveEvent = ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    const nextEvents = events.map((existingEvent) =>
      existingEvent.id === event.id ? updatedEvent : existingEvent
    );
    setEvents(nextEvents);
  };

  const resizeEvent = ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    const nextEvents = events.map((existingEvent) =>
      existingEvent.id === event.id ? updatedEvent : existingEvent
    );
    setEvents(nextEvents);
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.color || '#3174ad';
    const style = {
      backgroundColor,
      borderRadius: '0px',
      opacity: 0.8,
      color: 'black',
      border: '0px',
      display: 'block'
    };
    return {
      style
    };
  };

  return (
   
      <ContentWrapper>
        <Sidebar>
          <PickerWrapper>
            <ChromePicker color={color} onChangeComplete={(newColor) => setColor(newColor.hex)} />
          </PickerWrapper>
          <EventCreation>
            <EventInput type="text" placeholder="Event Title" id="new-event-title" />
            <AddButton onClick={() => {
              const title = document.getElementById('new-event-title').value;
              if (title) {
                const newEvent = {
                  id: Date.now().toString(),
                  start: new Date(),
                  end: new Date(),
                  title,
                  color
                };
                setEvents(prevEvents => [...prevEvents, newEvent]);
                document.getElementById('new-event-title').value = '';
              }
            }}>
              Add Event
            </AddButton>
          </EventCreation>
        </Sidebar>
        <CalendarContainer>
          <AgendaWrapper>
            <Calendar
              localizer={localizer}
              events={events.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end)
              }))}
              startAccessor="start"
              endAccessor="end"
              selectable
              resizable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onEventDrop={moveEvent}
              onEventResize={resizeEvent}
              style={{ height: 500 }}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              defaultView='agenda'
            />
          </AgendaWrapper>
        </CalendarContainer>
      </ContentWrapper>
   
  );
}

export default CalendarPlan;
