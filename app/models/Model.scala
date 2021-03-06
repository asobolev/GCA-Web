// Copyright © 2014, German Neuroinformatics Node (G-Node)
//                   A. Stoewer (adrian.stoewer@rz.ifi.lmu.de)
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted under the terms of the BSD License. See
// LICENSE file in the root of the Project.

package models

import collection.JavaConversions.asJavaCollection
import java.util.{Set => JSet, TreeSet => JTreeSet, UUID}
import javax.persistence.{PrePersist, Id, MappedSuperclass}

/**
 * Trait that defines stuff that is common for all models.
 * This trait may be extended with some that properties like timestamps
 * etc. when needed.
 */
@MappedSuperclass
class Model extends Ordered[Model] {

  /**
   * The primary key of the model.
   */
  @Id
  var uuid: String = _


  @PrePersist
  protected def beforePersist() : Unit = {
    if (uuid == null)
      uuid = Model.makeUUID()
  }

  override def compare(that: Model): Int = {
    if (uuid != null && that.uuid != null)
      uuid.compareTo(that.uuid)
    else
      hashCode.compareTo(that.hashCode)
  }

  override def equals(that: Any) : Boolean = {
    that match {
      case t: Model => (uuid != null && uuid == t.uuid) || hashCode == t.hashCode
      case _ => false
    }
  }

}

object Model {

  def makeUUID() : String = {
    UUID.randomUUID().toString
  }

  /**
   * Unwrap an optional value.
   *
   * @param value The optional value.
   *
   * @return The value wrapped by Some or 0
   */
  def unwrapVal[T: Numeric](value: Option[T]) = {
    value match {
      case Some(x) => x
      case _ => implicitly[Numeric[T]].zero
    }
  }

  /**
   * Unwrap an optional reference.
   *
   * @param value An optional value
   *
   * @return The value wrapped by Some or null
   */
  def unwrapRef[T >: Null](value: Option[T]) : T = {
    value match {
      case Some(x) => x
      case _ => null
    }
  }

  /**
   *
   * @param seq The sequence to convert.
   *
   * @return A list
   */
  def toJSet[T](seq : Seq[T]) : JSet[T] = {
    seq match {
      case Nil => new JTreeSet[T]()
      case _ => new JTreeSet[T](asJavaCollection(seq))
    }
  }


}

/**
 * A base class that defines a pos field for sorting
 */
@MappedSuperclass
class PositionedModel extends Model {

  var position: Int = _

  override def compare(that: Model): Int = {
    that match {
      case sm: PositionedModel => this.position - sm.position
      case _ => super.compare(that)
    }
  }
}
