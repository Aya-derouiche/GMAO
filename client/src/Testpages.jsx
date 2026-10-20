import React from 'react'

function Testpages() {
    return (
        <div className='content-wrapper'>
        <div className="wrapper">
          <div className="col-md-9">
            <div className="card card-primary card-outline">
              <div className="card-header">
                <h3 className="card-title">Compose New Message</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <textarea id="compose-textarea" className="form-control" style={{ height: '300px' }}>
                  
                  </textarea>
                </div>
                <div className="form-group">
                  <div className="btn btn-default btn-file">
                    <i className="fas fa-paperclip"></i> Attachment
                    <input type="file" name="attachment" />
                  </div>
                  <p className="help-block">Max. 32MB</p>
                </div>
              </div>
              <div className="card-footer">
                <div className="float-right">
                  <button type="button" className="btn btn-default"><i className="fas fa-pencil-alt"></i> Draft</button>
                  <button type="submit" className="btn btn-primary"><i className="far fa-envelope"></i> Send</button>
                </div>
                <button type="reset" className="btn btn-default"><i className="fas fa-times"></i> Discard</button>
              </div>
            </div>
          </div>
        </div>
        </div>
      );
    }

export default Testpages
