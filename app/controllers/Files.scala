package controllers

import play.api.mvc._
import play.api.libs.json._
import service.AbstractService
import models.{Conference, Abstract}

/**
 * Abstracts controller.
 * Manages HTTP request logic for abstracts.
 */
object Files extends Controller {

  /**
   * An abstract info by id.
   *
   * @param id The id of the abstract.
   *
   * @return An abstract as JSON / abstract page.
   */
  def upload(id: String) : Action[AnyContent] = TODO

  /**
   * Update an existing conference info.
   *
   * @param id   The abstract to update.
   *
   * @return abstract in JSON / abstract page
   */
  def download(id: String, f_id: String) : Action[AnyContent] = TODO

  /**
   * Delete an existing abstract.
   *
   * @param id   Abstract id to delete.
   *
   * @return OK or Failed / Redirect to the abstract list page
   */
  def delete(id: String, f_id: String) : Action[AnyContent] = TODO

}
